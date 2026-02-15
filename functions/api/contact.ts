import type { Env } from '../env';
import { getClientIP, isValidOrigin, escapeHtml, jsonResponse } from '../lib/helpers';

// Basic email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validation rules
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string; // Honeypot field
}

function validateFormData(data: unknown): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  // Type guard check
  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Données invalides'] };
  }

  const formData = data as Record<string, unknown>;

  if (!formData.name || typeof formData.name !== 'string') {
    errors.push('Le nom est requis');
  } else if (formData.name.trim().length > 200) {
    errors.push('Le nom est trop long (max 200 caractères)');
  }

  if (!formData.email || typeof formData.email !== 'string') {
    errors.push('L\'email est requis');
  } else if (!isValidEmail(formData.email.trim())) {
    errors.push('L\'adresse email est invalide');
  }

  if (!formData.subject || typeof formData.subject !== 'string') {
    errors.push('Le sujet est requis');
  } else if (formData.subject.trim().length > 300) {
    errors.push('Le sujet est trop long (max 300 caractères)');
  }

  if (!formData.message || typeof formData.message !== 'string') {
    errors.push('Le message est requis');
  } else if (formData.message.trim().length > 5000) {
    errors.push('Le message est trop long (max 5000 caractères)');
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // 1. Origin check
  const origin = request.headers.get('Origin');
  if (!isValidOrigin(origin)) {
    return jsonResponse({ error: 'Origine non autorisée' }, 403);
  }

  // 2. Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Corps de requête invalide' }, 400);
  }

  // Type guard for body
  if (typeof body !== 'object' || body === null) {
    return jsonResponse({ error: 'Corps de requête invalide' }, 400);
  }

  const requestBody = body as Record<string, unknown>;

  // 3. Honeypot check — if website field is filled, it's a bot
  if (
    requestBody.website &&
    typeof requestBody.website === 'string' &&
    requestBody.website.trim() !== ''
  ) {
    // Return fake success to avoid tipping off bots
    return jsonResponse({ success: true });
  }

  // 4. Validate form data
  const validation = validateFormData(requestBody);
  if (!validation.valid) {
    return jsonResponse({ error: 'Données invalides', details: validation.errors }, 400);
  }

  // 5. Rate limiting — 1 submission per IP per 5 minutes
  const ip = getClientIP(request);
  const rateLimitKey = `rate:contact:${ip}`;

  const existingRateLimit = await env.SPAF_KV.get(rateLimitKey);
  if (existingRateLimit) {
    return jsonResponse(
      {
        error: 'Trop de soumissions. Veuillez patienter 5 minutes avant de réessayer.',
      },
      429
    );
  }

  // 6. Send email via Resend
  const formData: ContactFormData = {
    name: (requestBody.name as string).trim(),
    email: (requestBody.email as string).trim(),
    subject: (requestBody.subject as string).trim(),
    message: (requestBody.message as string).trim(),
  };

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'contact@spafnat.com', // Domain verified ✓
        to: env.CONTACT_RECIPIENT, // Email recipient configured in .dev.vars (local) or Cloudflare Dashboard (production)
        reply_to: formData.email, // President can reply directly to sender
        subject: `[SPAF Contact] ${formData.subject}`,
        text: `Message de : ${formData.name} (${formData.email})\n\nSujet : ${formData.subject}\n\nMessage :\n${formData.message}`,
        html: `
          <p><strong>Message de :</strong> ${escapeHtml(formData.name)} (${escapeHtml(formData.email)})</p>
          <p><strong>Sujet :</strong> ${escapeHtml(formData.subject)}</p>
          <p><strong>Message :</strong></p>
          <p>${escapeHtml(formData.message).replace(/\n/g, '<br>')}</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error:', errorData);
      throw new Error('Failed to send email');
    }

    // 7. Set rate limit key (only after successful send)
    await env.SPAF_KV.put(rateLimitKey, '1', { expirationTtl: 300 }); // 5 minutes

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Error sending contact form email:', error);
    return jsonResponse({ error: 'Échec de l\'envoi du message. Veuillez réessayer.' }, 500);
  }
};
