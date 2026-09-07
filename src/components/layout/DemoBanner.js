"use client";

import { useEffect, useRef } from "react";
import { isPublicDemoMode } from "@/lib/demo/config-public";

export default function DemoBanner() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isPublicDemoMode()) return undefined;

    const syncHeight = () => {
      document.documentElement.style.setProperty("--demo-banner-height", `${el.offsetHeight}px`);
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--demo-banner-height");
    };
  }, []);

  if (!isPublicDemoMode()) return null;

  async function exitDemo() {
    await fetch("/api/demo/session", { method: "DELETE" });
    window.location.href = "/demo";
  }

  return (
    <div
      ref={ref}
      className="border-b border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5 text-center text-sm text-amber-950"
    >
      <span className="font-medium">Modo demonstração</span>
      <span className="mx-2 text-amber-700/60">·</span>
      <span className="text-amber-900/80">Dados fictícios, sem Supabase</span>
      <button
        type="button"
        onClick={exitDemo}
        className="ml-3 font-semibold text-amber-950 underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700"
      >
        Trocar perfil
      </button>
    </div>
  );
}
