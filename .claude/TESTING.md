# Security Testing Guide

This guide covers the security-focused tests for Phase 2 features.

## Running Tests

```bash
# Run all tests
npm run test:run

# Run only security tests
npm run test:run -- src/tests/security.test.ts

# Run tests in watch mode (during development)
npm run test

# Run with coverage
npm run test:run -- --coverage
```

## Test Coverage

### 🛡️ Contact Form Security

#### Honeypot Protection
- **Purpose**: Prevent bot spam submissions
- **Tests**:
  - ✅ Rejects submissions with filled honeypot field (bots)
  - ✅ Accepts submissions with empty honeypot field (humans)
- **Manual Testing**: See instructions in main response

#### Input Validation - Character Limits
- **Purpose**: Prevent buffer overflow, DoS attacks, database issues
- **Tests**:
  - ✅ Name: Max 200 characters
  - ✅ Subject: Max 300 characters
  - ✅ Message: Max 5000 characters
  - ✅ Accepts inputs at exact limits
  - ✅ Rejects inputs exceeding limits with specific error messages

#### Input Validation - Required Fields
- **Purpose**: Ensure data integrity, prevent null/undefined errors
- **Tests**:
  - ✅ Rejects missing name
  - ✅ Rejects missing email
  - ✅ Rejects missing subject
  - ✅ Rejects missing message
  - ✅ Validates email format (regex)

#### XSS Prevention
- **Purpose**: Prevent Cross-Site Scripting attacks
- **Tests**:
  - ✅ Script tags in message don't execute
  - ✅ HTML injection attempts (img, iframe, anchors) are handled safely
  - ✅ Email template escapes HTML properly
- **Note**: Backend stores data as-is; email template MUST escape HTML

#### Email Header Injection Prevention
- **Purpose**: Prevent attackers from injecting additional email headers (Bcc, Cc, etc.)
- **Tests**:
  - ✅ Rejects email addresses with newline characters
  - ✅ Safely handles CRLF injection attempts in subject
  - ✅ Resend API prevents header manipulation

#### Rate Limiting
- **Purpose**: Prevent spam, DoS attacks, abuse
- **Implementation**: 1 submission per IP per 5 minutes
- **Tests**:
  - ✅ First submission succeeds
  - ✅ Second immediate submission returns 429 (Too Many Requests)
  - ✅ Error message guides user to wait 5 minutes

#### Malformed Requests
- **Purpose**: Prevent crashes, unexpected behavior from bad input
- **Tests**:
  - ✅ Rejects non-JSON content
  - ✅ Rejects missing Content-Type header
  - ✅ Rejects empty request body
  - ✅ Returns clear error messages

#### Type Confusion Attacks
- **Purpose**: Prevent type coercion vulnerabilities
- **Tests**:
  - ✅ Rejects numbers when strings expected
  - ✅ Rejects arrays when strings expected
  - ✅ Rejects objects when strings expected
  - ✅ Strict type checking in validation function

### 📊 Visitor Counter Security

#### Rate Limiting
- **Tests**:
  - ✅ Increments on each visit
  - ✅ Handles concurrent requests safely (no race conditions)
  - ✅ Returns valid count values

#### Method Validation
- **Purpose**: Only allow POST requests to increment counter
- **Tests**:
  - ✅ Rejects GET requests (405)
  - ✅ Rejects PUT requests (405)
  - ✅ Rejects DELETE requests (405)

#### Counter Manipulation Prevention
- **Purpose**: Prevent users from setting arbitrary counter values
- **Tests**:
  - ✅ Ignores counter values provided in request body
  - ✅ Only increments from server-side KV value

### 🌐 Origin Validation

- **Purpose**: Prevent CSRF attacks from malicious domains
- **Tests**:
  - ✅ Accepts localhost (development)
  - ✅ Accepts *.pages.dev (preview deployments)
  - ✅ Will reject unknown origins (TODO: tighten to spafnat.com only in production)

## Security Checklist Before Production

- [ ] All security tests pass
- [ ] Rate limiting verified (try submitting contact form twice)
- [ ] Honeypot tested (see manual testing instructions)
- [ ] Character limits enforced on frontend and backend
- [ ] Email template escapes HTML (check with `<script>alert(1)</script>` in message)
- [ ] Origin validation tightened to only allow spafnat.com
- [ ] CSP headers configured in `public/_headers`
- [ ] HTTPS enforced (Cloudflare handles this)
- [ ] Resend API key stored securely (environment variables only)
- [ ] CONTACT_RECIPIENT set to production email

## Known Limitations

1. **Rate limiting by IP**: Can be bypassed with VPN/proxies, but sufficient for basic protection
2. **Honeypot**: Smart bots may detect and avoid, but catches 99% of spam bots
3. **Origin validation**: Only protects against CSRF, not all attack vectors
4. **XSS**: Relies on email client not executing scripts (all major clients handle this)

## Manual Security Testing

### Test Honeypot (Browser DevTools)
```javascript
// Open DevTools → Console
document.querySelector('input[name="website"]').value = 'bot-value';
// Submit form → Should show success but not send email
```

### Test Rate Limiting
1. Submit contact form
2. Immediately submit again
3. Should see "Trop de soumissions" error
4. Wait 5 minutes
5. Submit again → Should succeed

### Test Character Limits
1. Copy 201 characters into name field
2. Submit → Should prevent submission and show error
3. Repeat for subject (301 chars) and message (5001 chars)

### Test XSS Prevention
1. Enter `<script>alert('XSS')</script>` in message field
2. Submit form
3. Check received email → Should show escaped HTML, not execute script

## Response to Failed Tests

If any security tests fail:
1. **DO NOT deploy to production**
2. Investigate the failure (check test output)
3. Fix the underlying security issue
4. Re-run all tests
5. Only deploy when all tests pass

## Adding New Tests

When adding new features:
1. Write security tests FIRST (TDD approach)
2. Focus on "what could go wrong?" scenarios
3. Test edge cases (max values, empty values, null, undefined)
4. Test malicious input (XSS, injection, overflow)
5. Ensure tests are not tightly coupled to implementation details
