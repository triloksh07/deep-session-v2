'use client';
// components/InstallPWAButton.tsx // (or .js)

import { useState, useEffect } from 'react';
import { Button } from './ui/button';

// Define the interface for the event, if you're using TypeScript
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

const InstallPWAButton = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault(); // Prevent the default mini-infobar
      setInstallPrompt(event as BeforeInstallPromptEvent); // Store the event
      console.log("✅ 'beforeinstallprompt' event fired and captured.");
    };

    // Listen for the event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Cleanup: remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      // If there's no prompt event, do nothing.
      return;
    }

    // Show the browser's installation prompt
    await installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA installation');
    } else {
      console.log('User dismissed the PWA installation');
    }

    // We can only use the prompt once. Clear it.
    setInstallPrompt(null);
  };

  // Only render the button if the install prompt is available
  if (!installPrompt) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      style={{
        background: '#4F46E5',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 20px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.25)',
      }}
    >
      Install DeepSession
    </Button>
  );
};

export default InstallPWAButton;