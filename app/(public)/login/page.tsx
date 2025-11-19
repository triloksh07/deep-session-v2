// 'use client';
// app/(public)/login/page.tsx
import { Auth } from "../_components/Auth";
import { login, signup, loginWithGoogle, loginWithGithub } from "../_lib/authHandlersOLD";

export default function LoginPage() {
  return <Auth defaultTab="login" />
}
