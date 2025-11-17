'use client';
import { Auth } from "../_components/Auth";
import { login, signup, loginWithGoogle, loginWithGithub } from "../_lib/authHandlers";

export default function LoginPage() {
  return (
    <Auth
      onLogin={login}
      onSignup={signup}
      onGoogleSignIn={loginWithGoogle}
      onGitHubSignIn={loginWithGithub}
      isLoading={false}
      isProviderLoading={false}
      defaultTab="login" // 👈 force login tab
    />
  );
}
