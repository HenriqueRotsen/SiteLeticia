"use client";

import Script from "next/script";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const goals = [
  "Emagrecimento",
  "Cirurgia Bariátrica",
  "Saúde intestinal",
  "Medicina de precisão",
  "Nutrição clínica",
  "Hipertrofia"
];

const initialSignup = {
  fullName: "",
  phone: "",
  goal: goals[0]
};

const initialLookup = {
  phone: ""
};

function onlyNumbers(value) {
  return value.replace(/\D/g, "");
}

function formatPhone(value) {
  const digits = onlyNumbers(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function Feedback({ feedback }) {
  if (!feedback) return null;

  const styles = {
    success: "border-olive-500/30 bg-olive-50 text-olive-900",
    error: "border-red-300 bg-red-50 text-red-900",
    info: "border-graphite/15 bg-white text-graphite"
  };

  return (
    <div className={`mt-5 rounded-2xl border p-5 ${styles[feedback.type]}`}>
      {feedback.position ? (
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] opacity-70">
            Sua posição atual na fila
          </p>
          <p className="mt-2 text-5xl font-semibold">#{feedback.position}</p>
          <p className="mt-3 text-sm leading-6">{feedback.message}</p>
        </div>
      ) : (
        <p className="text-sm font-medium leading-6">{feedback.message}</p>
      )}
    </div>
  );
}

export default function WaitlistBox() {
  const [activeTab, setActiveTab] = useState("signup");
  const [signup, setSignup] = useState(initialSignup);
  const [lookup, setLookup] = useState(initialLookup);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const tabs = useMemo(
    () => [
      { id: "signup", label: "Entrar na Lista" },
      { id: "lookup", label: "Consultar Posição" }
    ],
    []
  );

  function handleTabChange(tab) {
    setActiveTab(tab);
    setFeedback(null);
  }

  async function getRecaptchaToken() {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!siteKey) {
      throw new Error("Proteção anti-spam ainda não configurada.");
    }

    if (!window.grecaptcha) {
      throw new Error("Proteção anti-spam ainda está carregando. Tente novamente.");
    }

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(siteKey, { action: "waitlist_signup" })
          .then(resolve)
          .catch(() => reject(new Error("Não foi possível validar o reCAPTCHA.")));
      });
    });
  }

  async function handleSignup(event) {
    event.preventDefault();
    setFeedback(null);

    const phone = onlyNumbers(signup.phone);
    const fullName = signup.fullName.trim();

    if (!fullName || phone.length < 10 || !signup.goal) {
      setFeedback({
        type: "error",
        message: "Preencha nome completo, WhatsApp com DDD e objetivo para entrar na lista."
      });
      return;
    }

    setLoading(true);

    let recaptchaToken;

    try {
      recaptchaToken = await getRecaptchaToken();
    } catch (error) {
      setLoading(false);
      setFeedback({
        type: "error",
        message: error.message
      });
      return;
    }

    const response = await fetch("/api/waitlist/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        phone,
        goal: signup.goal,
        recaptchaToken
      })
    });
    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setFeedback({
        type: "error",
        message: result.message || "Não foi possível concluir o cadastro agora."
      });
      return;
    }

    setSignup(initialSignup);
    setFeedback({
      type: "success",
      message:
        "Cadastro realizado com sucesso. Seu lugar na lista de prioridade foi reservado."
    });
  }

  async function handleLookup(event) {
    event.preventDefault();
    setFeedback(null);

    const phone = onlyNumbers(lookup.phone);

    if (phone.length < 10) {
      setFeedback({
        type: "error",
        message: "Digite o WhatsApp com DDD usado no cadastro."
      });
      return;
    }

    setLoading(true);

    const { data: patient, error: patientError } = await supabase
      .from("waitlist")
      .select("id, status")
      .eq("phone", phone)
      .maybeSingle();

    if (patientError) {
      setLoading(false);
      setFeedback({
        type: "error",
        message: "Não foi possível consultar sua posição agora. Tente novamente."
      });
      return;
    }

    if (!patient) {
      setLoading(false);
      setFeedback({
        type: "error",
        message: "Não encontramos cadastro com esse WhatsApp."
      });
      return;
    }

    if (patient.status === "called") {
      setLoading(false);
      setFeedback({
        type: "success",
        message:
          "Sua vaga foi liberada. Em breve a equipe entrará em contato pelo WhatsApp cadastrado."
      });
      return;
    }

    const { count, error: countError } = await supabase
      .from("waitlist")
      .select("id", { count: "exact", head: true })
      .eq("status", "waiting")
      .lte("id", patient.id);

    setLoading(false);

    if (countError) {
      setFeedback({
        type: "error",
        message: "Encontramos seu cadastro, mas não conseguimos calcular a posição."
      });
      return;
    }

    setFeedback({
      type: "info",
      position: count || 1,
      message: "Essa posição considera apenas pacientes ainda aguardando atendimento."
    });
  }

  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-porcelain/95 p-4 shadow-soft sm:p-6">
      {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
      ) : null}

      <div className="grid rounded-full bg-linen p-1 sm:grid-cols-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-olive-700 text-white shadow-sm"
                : "text-graphite/68 hover:text-graphite"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "signup" ? (
        <form className="mt-6 space-y-4" onSubmit={handleSignup}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-graphite" htmlFor="fullName">
              Nome completo
            </label>
            <input
              id="fullName"
              type="text"
              value={signup.fullName}
              onChange={(event) =>
                setSignup((current) => ({ ...current, fullName: event.target.value }))
              }
              className="w-full rounded-2xl border border-olive-900/10 bg-white px-4 py-3 text-graphite outline-none transition placeholder:text-graphite/35 focus:border-olive-600 focus:ring-4 focus:ring-olive-200"
              placeholder="Seu nome e sobrenome"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-graphite" htmlFor="phone">
              WhatsApp
            </label>
            <input
              id="phone"
              type="tel"
              value={signup.phone}
              onChange={(event) =>
                setSignup((current) => ({
                  ...current,
                  phone: formatPhone(event.target.value)
                }))
              }
              className="w-full rounded-2xl border border-olive-900/10 bg-white px-4 py-3 text-graphite outline-none transition placeholder:text-graphite/35 focus:border-olive-600 focus:ring-4 focus:ring-olive-200"
              placeholder="(00) 00000-0000"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-graphite" htmlFor="goal">
              Objetivo principal
            </label>
            <select
              id="goal"
              value={signup.goal}
              onChange={(event) =>
                setSignup((current) => ({ ...current, goal: event.target.value }))
              }
              className="w-full rounded-2xl border border-olive-900/10 bg-white px-4 py-3 text-graphite outline-none transition focus:border-olive-600 focus:ring-4 focus:ring-olive-200"
            >
              {goals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-olive-700 px-5 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-olive-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Reservar prioridade"}
          </button>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleLookup}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-graphite" htmlFor="lookupPhone">
              WhatsApp cadastrado
            </label>
            <input
              id="lookupPhone"
              type="tel"
              value={lookup.phone}
              onChange={(event) =>
                setLookup((current) => ({
                  ...current,
                  phone: formatPhone(event.target.value)
                }))
              }
              className="w-full rounded-2xl border border-olive-900/10 bg-white px-4 py-3 text-graphite outline-none transition placeholder:text-graphite/35 focus:border-olive-600 focus:ring-4 focus:ring-olive-200"
              placeholder="(00) 00000-0000"
              autoComplete="tel"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-graphite px-5 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-olive-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Consultando..." : "Ver minha posição"}
          </button>
        </form>
      )}

      <Feedback feedback={feedback} />
    </section>
  );
}
