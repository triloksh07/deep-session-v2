// app/(public)/verify-email/page.tsx
import { verifySessionCookie } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export default async function VerifyEmailPage() {
  const decoded = await verifySessionCookie();

  // If no session, send to login
  if (!decoded) redirect("/login");

  // If verified, go to dashboard
  if (decoded.email_verified) redirect("/dashboard/overview");

//  we will later add a client button to resend verification using Client SDK.
  return (
    <div className="container mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">Verify your email</h1>
      <p className="text-muted-foreground mt-2">
        We’ve sent a verification link to {decoded.email}. Please check your inbox.
      </p>
      <form action="/api/session/logout" method="post" className="mt-6">
        <button className="btn btn-outline" type="submit">Logout</button>
      </form>
    </div>
  );
}
