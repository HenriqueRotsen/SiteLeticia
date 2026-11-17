"use client";

import { useEffect } from "react";

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

// Registra o service worker e, dentro do app instalado, nunca mostra a landing page.
export default function PwaSetup() {
  useEffect(() => {
    if (isStandalone() && window.location.pathname === "/") {
      window.location.replace("/app");
      return;
    }
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
