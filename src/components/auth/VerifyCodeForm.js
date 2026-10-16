"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { btnPrimary, inputClassName } from "@/components/layout/AppShell";

export default function VerifyCodeForm() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("error");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    const response = await fetch("/api/auth/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() })
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFeedbackTone("error");
      setFeedback(result.message || "Código inválido.");
      return;
    }

    const requestedNext = searchParams.get("next");
    const roleHome = result.redirectTo || "/app";
    const safeNext =
      requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : roleHome;
    window.location.href = safeNext;
  }

  async function handleResend() {
    setResending(true);
    setFeedback("");
    const response = await fetch("/api/auth/mfa/resend", { method: "POST" });
    const result = await response.json();
    setResending(false);
    setFeedbackTone(response.ok ? "ok" : "error");
    setFeedback(result.message || (response.ok ? "Código reenviado." : "Não foi possível reenviar."));
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm leading-6 text-graphite/60">
        Digite o código de 6 dígitos enviado para o seu e-mail. Ele expira em 10 minutos.
      </p>

      <div>
        <label className="mb-2 block text-sm font-medium text-graphite/70" htmlFor="code">
          Código
        </label>
        <input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className={inputClassName("tracking-[0.35em] text-center text-lg")}
          placeholder="000000"
        />
      </div>

      <button type="submit" disabled={loading || code.length !== 6} className={btnPrimary("w-full")}>
        {loading ? "Validando..." : "Confirmar código"}
      </button>

      <button
        type="button"
        disabled={resending}
        onClick={handleResend}
        className="w-full text-sm font-semibold text-olive-700 hover:text-olive-800 disabled:opacity-60"
      >
        {resending ? "Reenviando..." : "Reenviar código"}
      </button>

      {feedback ? (
        <p
          className={`rounded-xl border p-4 text-sm ${
            feedbackTone === "ok"
              ? "border-olive-200 bg-olive-50 text-olive-900"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback}
        </p>
      ) : null}

      <p className="text-center text-sm text-graphite/55">
        <Link href="/entrar" className="font-semibold text-olive-700 hover:text-olive-800">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
