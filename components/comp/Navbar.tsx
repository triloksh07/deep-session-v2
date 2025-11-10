"use client"
import React from 'react';
// import { useAuth } from './contexts/AuthContext';
// import { supabaseUrl } from './utils/supabase/info';
import { Button } from '@/components/ui/button';
import { Timer, Download, User, LogOut, Moon, Sun } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@//components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { ModeToggle } from '@/components/toggle-theme'

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
import { db, auth } from '@/lib/firebase';

export function Navbar() {
  // const { user, signOut, accessToken } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    setIsDark(theme === 'dark');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  // NEW: Modern way to handle auth state changes with Firebase
  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // setIsLoading(false);
        setIsAuthReady(true); // <-- Set auth ready
      } else {
        setUser(null);
      }
      setIsLoading(false); // You already have this state
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = async () => {
    await signOut(auth);
    // No need to refresh, onAuthStateChanged will set user to null
  };
  // const handleExport = async () => {

  // };

  return (
    <nav className="w-screen border-b border-gray-200 dark:border-gray-700 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-linear-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">DeepSession</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Smart Session Tracking</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {/* <ModeToggle /> */}

            <Button variant="ghost" size="sm" onClick={() => { }}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  <span className='hidden sm:inline'> {user?.displayName?.split(' ')[0] || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
                  <p className="text-sm font-medium truncate flex flex-col">
                    <span className='inline md:hidden'> {user?.displayName?.split(' ')[0] || 'User'}</span>
                    <span>{user?.email}</span>
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}