Here’s a clear **Markdown flow diagram** showing where the **Firebase Client SDK** vs **Firebase Admin SDK** are used in DeepSession v3:


# 🔐 DeepSession v3 Authentication Flow

## 1. Signup (Client SDK)
- User enters email + password (or Google/GitHub).
- **Client SDK** (`firebase/auth`) creates account.
- `sendEmailVerification(user)` → sends verification link.
- ✅ Account exists but `emailVerified = false`.

---

## 2. Email Verification
- User clicks verification link in email.
- Firebase marks `emailVerified = true` in Auth record.
- No Admin SDK needed here — handled by Firebase.

---

## 3. Login (Client SDK)
- User signs in with email/password or provider.
- **Client SDK** gets ID token via `user.getIdToken()`.
- Client sends ID token → `/api/session/set`.

---

## 4. Session Cookie Minting (Admin SDK)
- **Admin SDK** (`authAdmin`) verifies ID token.
- Admin SDK mints **secure session cookie**.
- Cookie is set with `HttpOnly`, `Secure`, `SameSite=strict`.

---

## 5. Middleware (Admin SDK)
- Every request to authed routes runs `middleware.ts`.
- Reads `session` cookie.
- **Admin SDK** verifies cookie:
  ```ts
  const decoded = await authAdmin.verifySessionCookie(sessionCookie, true);
  ```
- If `!decoded.email_verified` → redirect `/verify-email`.
- If invalid/expired → redirect `/login`.
- If valid → allow access.

---

## 6. Server Components (Admin SDK for Reads)
- Authed pages fetch data server-side:
  ```ts
  const userId = await getUserId(); // via Admin SDK
  const sessions = await getSessionsData(userId);
  ```
- ✅ Data is fetched securely before HTML is sent.

---

## 7. Server Actions (Admin SDK for Writes)
- Mutations colocated in `actions.ts` files:
  ```ts
  'use server';
  export async function updateSessionAction(id, title) {
    const userId = await getUserId(); // Admin SDK
    await adminDb.doc(`sessions/${id}`).update({ title });
    revalidatePath('/dashboard/sessions');
  }
  ```
- ✅ Secure, server-only mutations.

---

## 8. Logout
- Client calls `/api/session/logout`.
- **Admin SDK** clears cookie.
- Middleware sees no cookie → redirect `/login`.

---

# ⚖️ Summary

- **Client SDK**: Signup, login, email verification, local state.
- **Admin SDK**: Verify cookies, mint cookies, enforce roles, revoke tokens, secure reads/writes.
- Middleware + Server Actions rely on **Admin SDK** as the trust anchor.

---

This `.md` diagram makes the **division of responsibility crystal clear**:  
- Client SDK = user-facing auth flows.  
- Admin SDK = server-side trust, session enforcement, and secure mutations.  
- Middleware + Server Actions rely on Admin SDK as the trust anchor.