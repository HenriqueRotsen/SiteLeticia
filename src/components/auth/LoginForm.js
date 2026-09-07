"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { btnPrimary, inputClassName } from "@/components/layout/AppShell";
import PasswordInput from "@/components/ui/PasswordInput";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFeedback(result.message || "Não foi possível entrar.");
      return;
    }

    const next = searchParams.get("next") || "/app";
    window.location.href = next;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {searchParams.get("registered") ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Conta criada! Faça login para continuar.
        </p>
      ) : null}

      {searchParams.get("reset") ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Senha redefinida com sucesso. Faça login com a nova senha.
        </p>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-graphite/70" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
          className={inputClassName()}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="block text-sm font-medium text-graphite/70" htmlFor="password">
            Senha
          </label>
          <Link
            href={form.email ? `/recuperar-senha?email=${encodeURIComponent(form.email)}` : "/recuperar-senha"}
            className="text-xs font-semibold text-olive-700 hover:text-olive-800"
          >
            Esqueci minha senha
          </Link>
        </div>
        <PasswordInput
          id="password"
          required
          value={form.password}
          onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
        />
      </div>

      <button type="submit" disabled={loading} className={btnPrimary("w-full")}>
        {loading ? "Entrando..." : "Entrar"}
      </button>

      {feedback ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{feedback}</p>
      ) : null}

      <p className="text-center text-sm text-graphite/55">
        Ainda não tem conta?{" "}
        <Link href="/criar-conta" className="font-semibold text-olive-700 hover:text-olive-800">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
