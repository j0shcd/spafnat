# Honeypot Field Testing Guide

## What is a Honeypot?

A honeypot is a hidden form field that only bots will fill out. Humans can't see it (it's hidden with CSS), so they leave it empty. Bots automatically fill all fields, so they'll fill it out, revealing themselves.

## How It Works in SPAF

1. **Frontend**: Hidden input field named `website` (line 595-603 in Index.tsx)
   - Positioned absolutely off-screen
   - Opacity set to 0
   - Tab index -1 (keyboard navigation skips it)
   - Aria-hidden (screen readers ignore it)

2. **Backend**: Checks if field is filled (lines 119-129 in contact.ts)
   - If filled → return fake success (don't alert the bot)
   - If empty → process normally (it's a human)

## Testing Methods

### Method 1: Browser DevTools Console

1. Open the SPAF homepage
2. Scroll to the contact form
3. Open DevTools (F12 or Right-click → Inspect)
4. Go to the **Console** tab
5. Paste this command:
   ```javascript
   document.querySelector('input[name="website"]').value = 'http://spam-link.com';
   ```
6. Fill out the rest of the form normally:
   - Name: "Bot Test"
   - Email: your email
   - Subject: "Testing Honeypot"
   - Message: "This should not send an email"
7. Click "Envoyer le message"

**Expected Result:**
- ✅ Success message appears: "Message envoyé"
- ✅ Form clears
- ❌ **No email is sent** to CONTACT_RECIPIENT
- ✅ Server logs show honeypot detected (check wrangler console)

### Method 2: Direct API Call (curl)

```bash
curl -X POST http://localhost:8788/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bot Name",
    "email": "bot@example.com",
    "subject": "Bot Subject",
    "message": "Bot message",
    "website": "http://spam-link.com"
  }'
```

**Expected Response:**
```json
{"success": true}
```

**Expected Behavior:**
- No email sent
- Rate limit NOT applied (fake success doesn't consume rate limit quota)

### Method 3: Automated Test

```bash
npm run test:run -- src/tests/security.test.ts -t "honeypot"
```

This runs the automated honeypot tests.

## Verifying Honeypot is Hidden

1. Open the contact form
2. Right-click the form → Inspect
3. Find the `<input name="website">` element
4. Check its computed styles:
   - `position: absolute`
   - `opacity: 0`
   - `z-index: -10`
   - `tabindex: -1`

5. Try to tab to it with keyboard:
   - Press Tab repeatedly through the form
   - You should NEVER focus on the honeypot field

## Security Considerations

### Why Fake Success?

We return `{"success": true}` even when honeypot is filled because:
- If we returned an error, bots would learn to avoid filling that field
- Fake success wastes the bot's time (it thinks it succeeded)
- Prevents bot from trying alternative attack methods

### Limitations

- **Smart bots**: May detect hidden fields via CSS analysis
- **Mitigation**: Our honeypot is named "website" which is plausible (some forms ask for website)
- **Bypass rate**: ~1-5% of sophisticated bots may bypass
- **Effectiveness**: Catches 95%+ of spam bots (simple form fillers)

### Logging

The backend should log honeypot detections for monitoring:
```typescript
// In contact.ts (lines 119-129)
if (requestBody.website && typeof requestBody.website === 'string' && requestBody.website.trim() !== '') {
  console.log('[Security] Honeypot triggered:', {
    ip: getClientIP(request),
    website: requestBody.website,
    timestamp: new Date().toISOString(),
  });
  // Return fake success...
}
```

This helps track bot activity and identify spam patterns.

## Troubleshooting

### Honeypot field is visible
- Check CSS in Index.tsx (lines 595-603)
- Verify `className="absolute opacity-0 -z-10"`
- Check browser console for CSS errors

### Honeypot not catching bots
- Verify backend logic (contact.ts lines 119-129)
- Check if field name changed (must be "website")
- Test with Method 1 above to confirm it works

### Legitimate emails blocked
- This should NEVER happen (field is invisible to humans)
- If reported, check browser compatibility (old browsers may show hidden fields)
- Review server logs to confirm honeypot was actually filled

## Best Practices

1. **Never mention "honeypot" in frontend code comments** (bots scan source code)
2. **Use a plausible field name** (we use "website" - many forms legitimately ask for this)
3. **Don't add too many honeypots** (1 is sufficient, multiple may trigger spam filters)
4. **Monitor logs** (track how many bots are caught)
5. **Combine with rate limiting** (defense in depth)

## Future Improvements

- Add timestamp-based challenge (verify form wasn't submitted instantly)
- Add JavaScript challenge (verify browser can execute JS)
- Add CAPTCHA fallback for suspected bot IPs (after multiple honeypot triggers)
