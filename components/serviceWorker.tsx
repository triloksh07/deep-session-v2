"use client";
import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // client/register-sw.js (import from _app)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(reg => {
              console.log('SW registered:', reg);
              if (!navigator.serviceWorker.controller) {
                console.log('No active controller yet — waiting for activation');
              }
              // listen for lifecycle changes
              reg.addEventListener('updatefound', () => {
                console.log('updatefound', reg.installing);
                reg.installing?.addEventListener('statechange', (state) => {
                  console.log('SW state:', reg.installing, state);
                });
              });
            })
            .catch(err => console.error('SW registration failed:', err));
        });
      }
    }

    // if ("serviceWorker" in navigator) {
    //   navigator.serviceWorker.register("/sw.js")
    //     .then((reg) => console.log("SW registered:", reg))
    //     .catch((err) => console.error("SW registration failed:", err));
    // }
  }, []);

  return null;
}
