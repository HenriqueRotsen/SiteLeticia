"use client";

import { useState } from "react";
import Link from "next/link";
import { GOALS } from "@/lib/constants";
import { btnPrimary, inputClassName } from "@/components/layout/AppShell";
import PasswordInput from "@/components/ui/PasswordInput";

const initial = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  cpf: "",
  goal: GOALS[0],
  consent: false
};

export default function SignupForm() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [waitlistPosition, setWaitlistPosition] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        cpf: form.cpf,
        goal: form.goal,
        consent: form.consent
      })
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFeedback(result.message || "Não foi possível criar a conta.");
      return;
    }

    if (result.waitlist?.position) {
      setWaitlistPosition(result.waitlist.position);
      setFeedback("Conta criada com sucesso. Sua posição na fila foi registrada.");
      return;
    }

    window.location.href = "/entrar?registered=1";
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {[
        ["fullName", "Nome completo", "text"],
        ["email", "E-mail", "email"],
        ["phone", "WhatsApp", "tel"],
        ["cpf", "CPF", "text"]
      ].map(([key, label, type]) => (
        <div key={key}>
          <label className="mb-2 block text-sm font-medium text-graphite/70" htmlFor={key}>
            {label}
          </label>
          <input
            id={key}
            type={type}
            required
            value={form[key]}
            onChange={(e) => setForm((c) => ({ ...c, [key]: e.target.value }))}
            className={inputClassName()}
          />
        </div>
      ))}

      <div>
        <label className="mb-2 block text-sm font-medium text-graphite/70" htmlFor="password">
          Senha
        </label>
        <PasswordInput
          id="password"
          required
          value={form.password}
          onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
          autoComplete="new-password"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-graphite/70" htmlFor="goal">
          Objetivo
        </label>
        <select
          id="goal"
          value={form.goal}
          onChange={(e) => setForm((c) => ({ ...c, goal: e.target.value }))}
          className={inputClassName()}
        >
          {GOALS.map((goal) => (
            <option key={goal} value={goal}>
              {goal}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-start gap-3 text-sm leading-6 text-graphite/65">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => setForm((c) => ({ ...c, consent: e.target.checked }))}
          className="mt-1"
          required
        />
        <span>
          Li e aceito a{" "}
          <Link href="/privacidade" className="font-semibold text-olive-700 hover:text-olive-800">
            política de privacidade
          </Link>{" "}
          e os{" "}
          <Link href="/termos" className="font-semibold text-olive-700 hover:text-olive-800">
            termos de uso
          </Link>
          , e autorizo o tratamento dos meus dados de saúde para acompanhamento nutricional.
        </span>
      </label>

      <button type="submit" disabled={loading} className={btnPrimary("w-full")}>
        {loading ? "Criando conta..." : "Criar conta"}
      </button>

      {waitlistPosition ? (
        <div className="rounded-2xl border border-olive-200 bg-olive-50 p-5 text-olive-900">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] opacity-70">Posição na fila</p>
          <p className="mt-2 text-4xl font-semibold">#{waitlistPosition}</p>
          <Link
            href="/entrar?registered=1"
            className="mt-4 inline-flex text-sm font-semibold text-olive-800 underline decoration-olive-900/20"
          >
            Continuar para o login
          </Link>
        </div>
      ) : null}

      {feedback && !waitlistPosition ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{feedback}</p>
      ) : null}

      {feedback && waitlistPosition ? (
        <p className="rounded-xl border border-olive-200 bg-olive-50 p-4 text-sm text-olive-900">{feedback}</p>
      ) : null}

      <p className="text-center text-sm text-graphite/55">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-olive-700 hover:text-olive-800">
          Entrar
        </Link>
      </p>
    </form>
  );
}
