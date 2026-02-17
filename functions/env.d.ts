// Cloudflare Pages Functions environment types

export interface Env {
  // Phase 2: KV storage and email
  SPAF_KV: KVNamespace;
  RESEND_API_KEY: string;
  CONTACT_RECIPIENT: string;
  ALLOWED_ORIGINS?: string;

  // Phase 3: Auth and file storage
  JWT_SECRET: string;
  ADMIN_PASSWORD_HASH: string;
  SPAF_MEDIA: R2Bucket;
}
