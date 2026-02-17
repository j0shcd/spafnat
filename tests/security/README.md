# Security Test Suite

This directory contains security-focused tests for Phase 2 API endpoints.

## Purpose

These tests verify protection against common attack vectors:
- **XSS (Cross-Site Scripting)**: Malicious scripts in user input
- **Email injection**: Attempts to inject email headers
- **Rate limiting**: Preventing abuse and spam
- **Input validation**: Enforcing length limits and formats
- **Origin validation**: CSRF protection
- **Honeypot**: Bot detection
- **Data integrity**: Handling corrupted or missing data

## Running Tests

```bash
# Run all security tests
npm test -- tests/security

# Run specific test file
npm test -- tests/security/contact-form.test.ts

# Run with coverage
npm test -- --coverage tests/security
```

## Test Status

✅ These are automated tests with real request/response assertions against the functions handlers.
They cover:
1. Contact form validation/sanitization/rate-limiting/origin checks
2. Visitor counter method and storage hardening behavior
3. Error handling paths that must stay safe for production

## Manual Testing Checklist

Use these test cases as a guide for manual security testing:

### Contact Form

- [ ] **Honeypot**: Fill hidden "website" field → form succeeds but no email sent
- [ ] **Rate limit**: Submit twice rapidly → second blocked with 429 error
- [ ] **XSS in name**: Enter `<script>alert(1)</script>` → rejected or escaped
- [ ] **XSS in subject**: Same as above
- [ ] **XSS in message**: Same as above
- [ ] **Long name**: Enter 201 characters → specific error about name length
- [ ] **Long subject**: Enter 301 characters → specific error about subject length
- [ ] **Long message**: Enter 5001 characters → specific error about message length
- [ ] **Invalid email**: Enter `not-an-email` → specific error about email format
- [ ] **Missing fields**: Submit without name → specific error about required field
- [ ] **Email injection**: Try `test@example.com\nBcc: spam@evil.com` → rejected

### Visitor Counter

- [ ] **First visit**: Counter starts at 1
- [ ] **Increment**: Counter increases by 1 on each visit
- [ ] **Persistence**: Counter survives page refresh
- [ ] **Multiple rapid requests**: Counter doesn't increment excessively (rate limit TBD)

## Catastrophe Prevention

**Critical Security Requirements** (must verify before production):

1. **Resend API Key**: NEVER exposed in error responses or logs
2. **Rate Limiting**: Contact form limited to 1 submission per IP per 5 minutes
3. **Origin Validation**: Only accept requests from spafnat.com domains
4. **Input Sanitization**: All user input escaped/validated before sending email
5. **Honeypot**: Bots silently rejected (fake success, no email)

### Production Origin Lock

To lock down CSRF/origin checks in production, set `ALLOWED_ORIGINS` in Cloudflare:

```txt
ALLOWED_ORIGINS=https://spafnat.com,https://www.spafnat.com
```

You can include preview domains during testing if needed:

```txt
ALLOWED_ORIGINS=https://spafnat.com,https://www.spafnat.com,*.spafnat.pages.dev
```

## Future Work

To convert these to automated tests:

1. Create a test harness for Cloudflare Pages Functions
2. Mock the `env` object with KV and Resend API
3. Replace `expect(true).toBe(true)` with actual assertions
4. Use `miniflare` or Cloudflare Workers test environment

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Pages Functions Testing](https://developers.cloudflare.com/pages/platform/functions/)
- [Resend API Security](https://resend.com/docs/api-reference/introduction)
