## 📂 App Directory Structure (Next.js App Router)
### Public (unauthenticated) routes
```
app/(public)/login/page.tsx
app/(public)/signup/page.tsx
app/(public)/verify-email/page.tsx   <-- landing for unverified users

```
### Authenticated routes (protected by middleware)

```
app/(authed)/dashboard/layout.tsx    <-- shared sidebar/nav
app/(authed)/dashboard/page.tsx      <-- redirect to /dashboard/overview
app/(authed)/dashboard/overview/page.tsx
app/(authed)/dashboard/goals/page.tsx
app/(authed)/dashboard/sessions/page.tsx
app/(authed)/dashboard/analytics/page.tsx
app/(authed)/dashboard/exportdata/page.tsx
```

### Other top-level authed sections (future-proofing)
```
app/(authed)/settings/page.tsx
app/(authed)/profile/page.tsx
```

### 📂 API Routes (for cookie/session management and sensitive exports)
Even though we’ll use Server Actions for most mutations, API routes are still needed for session lifecycle and non-React-triggered tasks:

```
app/api/session/set/route.ts      <-- mint secure cookie
app/api/session/logout/route.ts   <-- clear cookie
app/api/export/route.ts           <-- CSV/PDF generation (admin-only)
```

### 📂 Server Actions (v3 mutations)
Instead of [app/api/*]() for Firestore mutations, we colocate actions.ts files next to their pages:
```
app/(authed)/dashboard/goals/actions.ts
app/(authed)/dashboard/sessions/actions.ts
app/(authed)/dashboard/analytics/actions.ts
```
#### Each file: 
```js
'use server';
import { adminDb } from '@/lib/firebase-admin';
import { getUserId } from '@/lib/server/auth';
import { revalidatePath } from 'next/cache';

export async function updateSessionAction(id: string, newTitle: string) {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');

  await adminDb.doc(`sessions/${id}`).update({ title: newTitle });
  revalidatePath('/dashboard/sessions');
  return { success: true };
}
```
### 📂 Lib Directory (server-only utilities)
```
lib/firebase-admin.ts     <-- initialize Admin SDK
lib/firebase.ts           <-- client SDK
lib/server/auth.ts        <-- getUserId(), verifySessionCookie
lib/server/data.ts        <-- Firestore queries (getSessionsData, getGoalsData)
```

### 🔒 Middleware Plan
- Located at /middleware.ts

- Checks session cookie via authAdmin.verifySessionCookie

- Redirect unauthenticated → /login

- Redirect authenticated but unverified → /verify-email

- Redirect authenticated visiting /login//signup → /dashboard

- Allow verified users → authed routes

### 🚀 Why this structure works
- **Nested routes under /dashboard** → scalable, future-proof grouping (like Vercel/GitHub).

- **Server Components for reads →** SSR data fetching, no waterfalls.

- **Server Actions for writes →** colocated, less boilerplate, secure.

- **API routes only for session lifecycle & exports →** minimal surface area.

- **Middleware →** bidirectional guard, email verification enforcement.

- **Lib separation →** clean server vs client SDK usage.

### 👉 This gives a professional v3 architecture:

- Public auth pages

- Authed dashboard with nested routes

- Middleware enforcing access

- Server Components for reads

- Server Actions for writes

- API routes for session lifecycle