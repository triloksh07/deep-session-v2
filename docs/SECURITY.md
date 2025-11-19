# DeepSession v3 Security Checklist

## Authentication
- [ ] All session cookies are `HttpOnly`, `Secure`, `SameSite=strict`.
- [ ] Session cookies minted only via Firebase Admin SDK.
- [ ] Middleware enforces:
  - Unauthenticated → `/login`
  - Authenticated but unverified → `/verify-email`
  - Authenticated visiting `/login`/`/signup` → `/dashboard`
- [ ] Email verification required before login.
- [ ] Logout clears session cookie server-side.

## Authorization
- [ ] Role-based access enforced via custom claims (`role: admin`, etc.).
- [ ] Admin-only endpoints (e.g., `/api/export`) check claims before execution.
- [ ] Principle of least privilege applied to Firebase service accounts.

## Data Protection
- [ ] Firestore rules enforce user-level access for client SDK.
- [ ] Admin SDK bypass only in server routes/actions with explicit checks.
- [ ] Sensitive exports logged and gated.

## Monitoring
- [ ] Audit logs enabled for login, logout, session minting, verification failures.
- [ ] Suspicious activity triggers token revocation (`authAdmin.revokeRefreshTokens(uid)`).
- [ ] All timestamps logged in ISO 8601 UTC.

## Operational Hygiene
- [ ] Service account keys stored in Secret Manager / env vars, not repo.
- [ ] Keys rotated regularly or replaced with Workload Identity Federation.
- [ ] Separate Firebase projects for staging vs production.
