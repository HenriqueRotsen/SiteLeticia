"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share, X } from "lucide-react";
import { isStandalone } from "@/components/pwa/PwaSetup";

const DISMISS_KEY = "install-app-dismissed";

function isIos() {
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

// Convite para instalar o app na tela de início (só aparece no celular, fora do app instalado).
export default function InstallAppCard() {
  const [mode, setMode] = useState(null); // "ios" | "android" | null
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // sem localStorage: mostra mesmo assim
    }

    if (isIos()) {
      setMode("ios");
      return;
    }

    function onPrompt(event) {
      event.preventDefault();
      setPromptEvent(event);
      setMode("android");
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignora
    }
    setMode(null);
  }

  async function install() {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    setPromptEvent(null);
    setMode(null);
  }

  if (!mode) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-olive-900/10 bg-porcelain/95 p-4 shadow-card">
      <Image src="/icons/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-graphite">Instale o app</p>
        {mode === "ios" ? (
          <p className="mt-1 text-sm text-graphite/70">
            No Safari, toque em <Share className="inline h-4 w-4 align-text-bottom" aria-label="Compartilhar" />{" "}
            e depois em <strong>Adicionar à Tela de Início</strong>.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-graphite/70">Acesse suas consultas com um toque, direto da tela inicial.</p>
            <button
              type="button"
              onClick={install}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-olive-700 px-4 py-2 text-sm font-semibold text-white"
            >
              <Download className="h-4 w-4" /> Instalar app
            </button>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar"
        className="rounded-lg p-1 text-graphite/50 hover:text-graphite"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
