'use client'
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Chrome, // Google Icon
  Github  // GitHub Icon
} from 'lucide-react';
import Link from 'next/link';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser, // Rename to avoid conflict
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

interface AuthProps {
  defaultTab?: 'login' | 'signup';
}

// --- CREATE THE PROVIDER INSTANCES ---
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export function Auth({
  defaultTab = 'login', // 👈 default to login
}: AuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProviderLoading, setIsProviderLoading] = useState(false); // For Google/GitHub auth

  // --- Auth Handlers ---
  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the user state update
      setIsLoading(false);
      return { success: true };
    } catch (error: unknown) {
      setIsLoading(false);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;

      // Update the user's profile
      await updateProfile(loggedInUser, { displayName: name });

      // (good practice) Save user to 'users' collection
      const userRef = doc(db, "users", loggedInUser.uid);
      await setDoc(userRef, {
        uid: loggedInUser.uid,
        email: loggedInUser.email,
        displayName: name,
      }, { merge: true });

      // onAuthStateChanged will handle the user state
      setIsLoading(false);
      return { success: true };
    } catch (error: unknown) {
      setIsLoading(false);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  };

  // Handler for Google/GitHub
  const updateUserProfile = async (user: FirebaseUser) => {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }, { merge: true });
  };

  const handleProviderSignIn = async (provider: 'google' | 'github') => {
    setIsProviderLoading(true);
    const authProvider = provider === 'google' ? googleProvider : githubProvider;

    try {
      const result = await signInWithPopup(auth, authProvider);
      await updateUserProfile(result.user);
      setIsProviderLoading(false);
      return { success: true };
    } catch (error: unknown) {
      // ... (error handling)
      setIsProviderLoading(false);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  };

  const handleGoogleSignIn = () => handleProviderSignIn('google');
  const handleGitHubSignIn = () => handleProviderSignIn('github');
  const handleLogout = async () => {
    await signOut(auth); // No need to refresh, onAuthStateChanged will set user to null
  };

  // Handler for Email/Password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (activeTab === 'signup') {
      if (!formData.name) {
        setError('Name is required');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
    }

    try {
      let result;
      if (activeTab === 'login') {
        result = await handleLogin(formData.email, formData.password);
      } else {
        result = await handleSignup(formData.email, formData.password, formData.name);
      }
      if (!result.success) {
        setError(result.error || 'An error occurred');
      }
    } catch (error: unknown) {
      console.error('Auth error:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(message);
    }
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
    setError('');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'login' | 'signup');
    resetForm();
  };

  const anyLoading = isLoading || isProviderLoading;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome to DeepSession</CardTitle>
            <p className="text-muted-foreground mt-2">
              Track your productivity and build better work habits
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {/* --- Provider Buttons --- */}
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleGoogleSignIn()}
              disabled={anyLoading}
            >
              {isProviderLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleGitHubSignIn()}
              disabled={anyLoading}
            >
              {isProviderLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Github className="mr-2 h-4 w-4" />
              )}
              Continue with GitHub
            </Button>
          </div>

          {/* --- Separator --- */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* --- Email/Pass Tabs --- */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" disabled={anyLoading}>Sign In</TabsTrigger>
              <TabsTrigger value="signup" disabled={anyLoading}>Sign Up</TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      disabled={anyLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Your password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                      disabled={anyLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      disabled={anyLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={anyLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="pl-10"
                      disabled={anyLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      disabled={anyLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                      disabled={anyLoading}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      disabled={anyLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pl-10"
                      disabled={anyLoading}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={anyLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              {activeTab === 'login' ? "Don't have an account? " : "Already have an account? "}
              {/* <button
                onClick={() => handleTabChange(activeTab === 'login' ? 'signup' : 'login')}
                className="text-primary hover:underline"
                disabled={anyLoading}
              >
                {activeTab === 'login' ? 'Sign up' : 'Sign in'}
              </button> */}
              {/* Prefetched when the link is hovered or enters the viewport */}
              <Link
                href={activeTab === 'login' ? "/signup" : "/login"}
                className="text-primary hover:underline"
              >
                {activeTab === 'login' ? 'Sign up' : 'Sign in'}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}