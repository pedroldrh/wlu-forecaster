"use client";

import { useEffect } from "react";

const APP_VERSION = "3";

export function CacheBuster() {
  useEffect(() => {
    const stored = localStorage.getItem("app-version");
    if (stored !== APP_VERSION) {
      localStorage.setItem("app-version", APP_VERSION);
      // Unregister service workers, clear caches, hard reload
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((r) => r.unregister());
        });
      }
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      // Force hard reload after a tick
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, []);

  return null;
}
