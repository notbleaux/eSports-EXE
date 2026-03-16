[Ver001.000]

# Security Policy

## Supported Versions

The following versions of the Libre-X-eSport 4NJZ4 TENET Platform are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.1.x   | :white_check_mark: |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

---

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it to us following these guidelines:

### How to Report

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. Email security concerns to: security@libre-x-esport.dev
3. Include the following in your report:
   - Description of the vulnerability
   - Steps to reproduce (proof of concept)
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

| Phase | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Initial Assessment | Within 5 business days |
| Fix Development | Based on severity* |
| Disclosure | Coordinated with reporter |

\* Severity-based timeline:
- **Critical**: 7 days
- **High**: 14 days  
- **Medium**: 30 days
- **Low**: 90 days

### Security Bug Bounty

We recognize security researchers who report valid vulnerabilities:

- Critical: $500 credit + Hall of Fame
- High: $250 credit + Hall of Fame
- Medium: $100 credit
- Low: Acknowledgment

---

## Security Best Practices

### For Developers

1. **Secrets Management**
   - Never commit secrets to version control
   - Use environment variables for all sensitive configuration
   - Rotate API keys every 90 days
   - Use strong, unique passwords for all services

2. **Dependency Management**
   ```bash
   # Run security audits regularly
   npm audit --audit-level=moderate
   pip install safety && safety check
   ```

3. **Code Review Requirements**
   - All auth-related changes require 2 approvals
   - Security-related changes require security team review
   - New dependencies must be security-reviewed

4. **Pre-commit Checks**
   ```bash
   # Install pre-commit hooks
   pre-commit install
   
   # The following run automatically:
   # - detect-secrets (API key detection)
   # - bandit (Python security linting)
   # - eslint-security (JavaScript security rules)
   ```

### For Administrators

1. **Environment Configuration**
   ```bash
   # Required in production:
   export APP_ENVIRONMENT=production
   export SECRET_KEY=<cryptographically-random-key>
   export TOTP_ENCRYPTION_KEY=<32-byte-key>
   export VAPID_CLAIMS_EMAIL=<valid-admin-email>
   export DATABASE_URL=<secure-connection-string>
   ```

2. **Rate Limiting**
   - Authentication endpoints: 5 requests/minute
   - 2FA verification: 5 requests/15 minutes
   - OAuth callbacks: 10 requests/minute
   - API general: 100 requests/minute per user

3. **HTTPS Enforcement**
   - All production traffic must use HTTPS
   - HSTS headers enabled
   - Secure cookies (`Secure`, `HttpOnly`, `SameSite`)

4. **Monitoring**
   - Failed login attempts are logged
   - Unusual API access patterns trigger alerts
   - Security events are retained for 90 days

---

## Security Features

### Authentication & Authorization

- **Password Security**: bcrypt hashing with salt
- **JWT Tokens**: Short-lived access tokens (15 min) + refresh tokens (7 days)
- **2FA Support**: TOTP (Time-based One-Time Password) with backup codes
- **OAuth Integration**: Secure OAuth 2.0 flows with Discord, Google, GitHub
- **Session Management**: Token revocation, automatic expiration

### Data Protection

- **Encryption at Rest**: 
  - TOTP secrets encrypted with Fernet (AES-128)
  - Database connections use TLS
  - Backup codes hashed with bcrypt
  
- **Encryption in Transit**:
  - TLS 1.3 for all connections
  - Certificate pinning for mobile apps

### API Security

- **Rate Limiting**: SlowAPI with Redis backend
- **Input Validation**: Pydantic schemas for all endpoints
- **SQL Injection Prevention**: Parameterized queries throughout
- **CORS**: Whitelist-based cross-origin policy
- **CSRF Protection**: State tokens for OAuth flows

### WebSocket Security

- **Authentication**: Token validation on connection
- **Message Size Limits**: 2000 characters for chat
- **Rate Limiting**: Connection throttling per user
- **Origin Validation**: Recommended for production

---

## Known Security Considerations

### Current Limitations

1. **Development Dependencies**
   - esbuild dev server vulnerability (moderate, dev-only)
   - Fix: Upgrade to Vite 8.0.0+ when available

2. **WebSocket Origin**
   - Origin validation not enforced by default
   - Recommendation: Configure `allowed_origins` in production

### Audit History

| Date | Scope | Critical | High | Medium | Report |
|------|-------|----------|------|--------|--------|
| 2026-03-16 | Phase 2 Modules | 0 | 2 | 2 | [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) |

---

## Security Compliance

### Standards

- OWASP Top 10 compliance
- GDPR data protection requirements
- CCPA privacy requirements

### Certifications

- SSL Labs A+ rating (production)
- Security headers scan: 100/100

---

## Contact

- **Security Team**: security@libre-x-esport.dev
- **PGP Key**: [Download Public Key](https://libre-x-esport.dev/security-pgp.key)
- **Emergency**: +1-XXX-XXX-XXXX (24/7 hotline)

---

*Last updated: 2026-03-16*
*Version: 1.0.0*
