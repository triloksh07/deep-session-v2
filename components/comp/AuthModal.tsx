import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Mail, Timer, Target, BarChart3, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signIn, isSupabaseConnected } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await signIn(email);
      if (error) {
        toast.error(error.message || 'Failed to send magic link');
      } else {
        setEmailSent(true);
        toast.success('Magic link sent! Check your email.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConnected) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Connection Required</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
                Please connect to Supabase to enable authentication and data storage.
              </DialogDescription>
            </div>
          </DialogHeader>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              FocusFlow requires a Supabase connection to store your session data and enable sign-in functionality.
            </AlertDescription>
          </Alert>

          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center">
            <Timer className="w-8 h-8 text-white" />
          </div>
          <div>
            <DialogTitle className="text-2xl">Welcome to FocusFlow</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
              Track your focus sessions, measure productivity, and achieve your goals.
            </DialogDescription>
          </div>
        </DialogHeader>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Timer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Smart Timer</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Analytics</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Goal Tracking</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending Magic Link...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Send Magic Link</span>
                </div>
              )}
            </Button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              We'll send you a magic link to sign in securely without a password.
            </p>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Check your email!</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                We've sent a magic link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Click the link in your email to sign in to FocusFlow.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="w-full"
            >
              Try Different Email
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}