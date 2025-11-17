'use client";'
import { Auth } from "@/components/Auth";
import { login, signup, loginWithGoogle, loginWithGithub } from "../_lib/authHandlers";

export default function AuthPage() {
  return (
    <Auth
      onLogin={login}
      onSignup={signup}
      onGoogleSignIn={loginWithGoogle}
      onGitHubSignIn={loginWithGithub}
      isLoading={false}
      isProviderLoading={false}
    />
  );
}
