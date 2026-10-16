"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { btnPrimary, inputClassName } from "@/components/layout/AppShell";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("neutral");
  const [sent, setSent] = useState(false);

  const error = searchParams.get("error");
  const errorMessage =
    error === "link_expirado"
      ? "O link de recuperação expirou ou já foi usado. Solicite um novo e-mail abaixo."
      : error === "link_invalido"
        ? "Não foi possível validar o link de recuperação. Solicite um novo e-mail abaixo."
        : "";

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");
    setSent(false);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFeedbackTone("error");
      setFeedback(result.message || "Não foi possível enviar o e-mail de recuperação.");
      return;
    }

    setFeedbackTone("success");
    setFeedback(result.message);
    setSent(true);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {errorMessage ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {errorMessage}
        </p>
      ) : null}

      <p className="text-sm text-graphite/60">
        Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um link para criar uma
        nova senha.
      </p>

      <div>
        <label className="mb-2 block text-sm font-medium text-graphite/70" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClassName()}
        />
      </div>

      <button type="submit" disabled={loading || sent} className={btnPrimary("w-full")}>
        {loading ? "Enviando..." : sent ? "E-mail enviado" : "Enviar link de recuperação"}
      </button>

      {feedback ? (
        <p
          className={`rounded-xl border p-4 text-sm ${
            feedbackTone === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {feedback}
        </p>
      ) : null}

      <p className="text-center text-sm text-graphite/55">
        Lembrou a senha?{" "}
        <Link href="/entrar" className="font-semibold text-olive-700 hover:text-olive-800">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
