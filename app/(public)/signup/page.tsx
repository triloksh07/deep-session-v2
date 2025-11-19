// 'use client';
import { Auth } from "../_components/Auth";
import { login, signup, loginWithGoogle, loginWithGithub } from "../_lib/authHandlersOLD";

export default function SignupPage() {
  return <Auth defaultTab="login" />
}
