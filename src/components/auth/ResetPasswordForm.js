"use client";

import { useState } from "react";
import Link from "next/link";
import { btnPrimary, inputClassName } from "@/components/layout/AppShell";
import PasswordInput from "@/components/ui/PasswordInput";

export default function ResetPasswordForm() {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("neutral");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFeedbackTone("error");
      setFeedback(result.message || "Não foi possível redefinir a senha.");
      return;
    }

    window.location.href = "/entrar?reset=1";
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm text-graphite/60">Escolha uma nova senha com pelo menos 8 caracteres.</p>

      <div>
        <label className="mb-2 block text-sm font-medium text-graphite/70" htmlFor="password">
          Nova senha
        </label>
        <PasswordInput
          id="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-graphite/70"
          htmlFor="confirmPassword"
        >
          Confirmar nova senha
        </label>
        <PasswordInput
          id="confirmPassword"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(event) =>
            setForm((current) => ({ ...current, confirmPassword: event.target.value }))
          }
        />
      </div>

      <button type="submit" disabled={loading} className={btnPrimary("w-full")}>
        {loading ? "Salvando..." : "Redefinir senha"}
      </button>

      {feedback ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
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
