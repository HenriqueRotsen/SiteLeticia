"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GOALS } from "@/lib/constants";
import { formatCpf, isValidCpf, normalizeCpf } from "@/lib/cpf-utils";
import { formatPhone, isValidPhone, normalizePhone } from "@/lib/phone";
import { PASSWORD_RULES } from "@/lib/validation/password";
import { btnPrimary, inputClassName } from "@/components/layout/AppShell";
import PasswordInput from "@/components/ui/PasswordInput";

const initial = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  cpf: "",
  goal: GOALS[0],
  consent: false
};

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-rose-700">{message}</p>;
}

export default function SignupForm() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [waitlistPosition, setWaitlistPosition] = useState(null);

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, ok: rule.test(form.password) })),
    [form.password]
  );

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validateField(key, value = form[key]) {
    switch (key) {
      case "fullName": {
        const name = String(value || "").trim();
        if (name.length < 2) return "Nome inválido.";
        if (name.split(/\s+/).filter(Boolean).length < 2) return "Informe nome e sobrenome.";
        return "";
      }
      case "email":
        return validateEmail(value) ? "" : "E-mail inválido.";
      case "phone":
        return isValidPhone(value) ? "" : "WhatsApp inválido.";
      case "cpf":
        return isValidCpf(value) ? "" : "CPF inválido.";
      case "password":
        return PASSWORD_RULES.every((rule) => rule.test(value))
          ? ""
          : "Senha fraca. Atenda a todos os requisitos.";
      case "confirmPassword":
        if (!value) return "Confirme a senha.";
        return value === form.password ? "" : "As senhas não coincidem.";
      case "consent":
        return value ? "" : "É necessário aceitar a política de privacidade.";
      default:
        return "";
    }
  }

  function validateAll() {
    const nextErrors = {};
    ["fullName", "email", "phone", "cpf", "password", "confirmPassword", "consent"].forEach(
      (key) => {
        const message = validateField(key);
        if (message) nextErrors[key] = message;
      }
    );
    setErrors(nextErrors);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      cpf: true,
      password: true,
      confirmPassword: true,
      consent: true
    });
    return Object.keys(nextErrors).length === 0;
  }

  function handleBlur(key) {
    setTouched((current) => ({ ...current, [key]: true }));
    const message = validateField(key);
    setErrors((current) => {
      if (!message) {
        if (!current[key]) return current;
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: message };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!validateAll()) {
      setFeedback("Revise os campos destacados antes de continuar.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        phone: normalizePhone(form.phone),
        cpf: normalizeCpf(form.cpf),
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
    <form className="space-y-3" onSubmit={handleSubmit} noValidate>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-graphite/70" htmlFor="fullName">
          Nome completo
        </label>
        <input
          id="fullName"
          type="text"
          autoComplete="name"
          required
          value={form.fullName}
          onChange={(event) => setField("fullName", event.target.value)}
          onBlur={() => handleBlur("fullName")}
          className={inputClassName(
            errors.fullName && touched.fullName ? "!border-rose-300" : ""
          )}
          aria-invalid={Boolean(errors.fullName && touched.fullName)}
        />
        {touched.fullName ? <FieldError message={errors.fullName} /> : null}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-graphite/70" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) => setField("email", event.target.value)}
          onBlur={() => handleBlur("email")}
          className={inputClassName(errors.email && touched.email ? "!border-rose-300" : "")}
          aria-invalid={Boolean(errors.email && touched.email)}
        />
        {touched.email ? <FieldError message={errors.email} /> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-graphite/70" htmlFor="phone">
            WhatsApp
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={(event) => setField("phone", formatPhone(event.target.value))}
            onBlur={() => handleBlur("phone")}
            className={inputClassName(errors.phone && touched.phone ? "!border-rose-300" : "")}
            aria-invalid={Boolean(errors.phone && touched.phone)}
          />
          {touched.phone ? <FieldError message={errors.phone} /> : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-graphite/70" htmlFor="cpf">
            CPF
          </label>
          <input
            id="cpf"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required
            placeholder="000.000.000-00"
            value={form.cpf}
            onChange={(event) => setField("cpf", formatCpf(event.target.value))}
            onBlur={() => handleBlur("cpf")}
            className={inputClassName(errors.cpf && touched.cpf ? "!border-rose-300" : "")}
            aria-invalid={Boolean(errors.cpf && touched.cpf)}
          />
          {touched.cpf ? <FieldError message={errors.cpf} /> : null}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-graphite/70" htmlFor="password">
          Senha
        </label>
        <PasswordInput
          id="password"
          required
          value={form.password}
          onChange={(event) => setField("password", event.target.value)}
          onBlur={() => handleBlur("password")}
          autoComplete="new-password"
          className={inputClassName(
            `pr-11 ${errors.password && touched.password ? "!border-rose-300" : ""}`
          )}
          aria-invalid={Boolean(errors.password && touched.password)}
        />
        <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {passwordChecks.map((rule) => (
            <li
              key={rule.id}
              className={`text-xs ${rule.ok ? "text-olive-700" : "text-graphite/45"}`}
            >
              {rule.ok ? "✓" : "○"} {rule.label}
            </li>
          ))}
        </ul>
        {touched.password ? <FieldError message={errors.password} /> : null}
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-graphite/70"
          htmlFor="confirmPassword"
        >
          Confirmar senha
        </label>
        <PasswordInput
          id="confirmPassword"
          required
          value={form.confirmPassword}
          onChange={(event) => setField("confirmPassword", event.target.value)}
          onBlur={() => handleBlur("confirmPassword")}
          autoComplete="new-password"
          className={inputClassName(
            `pr-11 ${errors.confirmPassword && touched.confirmPassword ? "!border-rose-300" : ""}`
          )}
          aria-invalid={Boolean(errors.confirmPassword && touched.confirmPassword)}
        />
        {touched.confirmPassword ? <FieldError message={errors.confirmPassword} /> : null}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-graphite/70" htmlFor="goal">
          Objetivo
        </label>
        <select
          id="goal"
          value={form.goal}
          onChange={(event) => setField("goal", event.target.value)}
          className={inputClassName()}
        >
          {GOALS.map((goal) => (
            <option key={goal} value={goal}>
              {goal}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-start gap-2.5 text-sm leading-5 text-graphite/65">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(event) => setField("consent", event.target.checked)}
          onBlur={() => handleBlur("consent")}
          className="mt-0.5"
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
          , e autorizo o tratamento dos meus dados de saúde.
        </span>
      </label>
      {touched.consent ? <FieldError message={errors.consent} /> : null}

      <button type="submit" disabled={loading} className={btnPrimary("w-full")}>
        {loading ? "Criando conta..." : "Criar conta"}
      </button>

      {waitlistPosition ? (
        <div className="rounded-xl border border-olive-200 bg-olive-50 p-4 text-olive-900">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
            Posição na fila
          </p>
          <p className="mt-1 text-3xl font-semibold">#{waitlistPosition}</p>
          <Link
            href="/entrar?registered=1"
            className="mt-3 inline-flex text-sm font-semibold text-olive-800 underline decoration-olive-900/20"
          >
            Continuar para o login
          </Link>
        </div>
      ) : null}

      {feedback && !waitlistPosition ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {feedback}
        </p>
      ) : null}

      {feedback && waitlistPosition ? (
        <p className="rounded-xl border border-olive-200 bg-olive-50 p-3 text-sm text-olive-900">
          {feedback}
        </p>
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
