"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GOALS } from "@/lib/constants";

const initialSignup = {
  fullName: "",
  phone: "",
  goal: GOALS[0]
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

function applyWaitlistStatus(result, type = "info") {
  if (result.status === "called") {
    return {
      type: "success",
      message: result.message
    };
  }

  if (result.position) {
    return {
      type,
      position: result.position,
      message: result.message
    };
  }

  return {
    type: "error",
    message: result.message || "Não foi possível obter sua posição."
  };
}

export default function WaitlistBox() {
  const [activeTab, setActiveTab] = useState("signup");
  const [signup, setSignup] = useState(initialSignup);
  const [lookup, setLookup] = useState(initialLookup);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const honeypotRef = useRef(null);
  const formStartedAt = useRef(0);

  useEffect(() => {
    formStartedAt.current = Date.now();
  }, []);

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

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
    if (!recaptchaSiteKey) {
      return null;
    }

    // Espera o script carregar por alguns segundos; se não carregar (bloqueador, rede lenta),
    // segue sem o token e o servidor usa as outras proteções.
    for (let i = 0; i < 20 && !window.grecaptcha; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!window.grecaptcha) return null;

    const token = new Promise((resolve) => {
      try {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(recaptchaSiteKey, { action: "waitlist_signup" })
            .then(resolve)
            .catch(() => resolve(null));
        });
      } catch {
        resolve(null);
      }
    });
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 6000));
    return Promise.race([token, timeout]);
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

    let recaptchaToken = null;

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
        recaptchaToken,
        website: honeypotRef.current?.value || "",
        elapsedMs: Date.now() - formStartedAt.current
      })
    });
    const result = await response.json();

    setLoading(false);

    if (response.ok) {
      setSignup(initialSignup);
      setFeedback(applyWaitlistStatus(result, "success"));
      return;
    }

    if (response.status === 409 && (result.position || result.status === "called")) {
      setFeedback(applyWaitlistStatus(result, "info"));
      return;
    }

    setFeedback({
      type: "error",
      message: result.message || "Não foi possível concluir o cadastro agora."
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

    const response = await fetch(`/api/waitlist/position?phone=${encodeURIComponent(phone)}`);
    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setFeedback({
        type: "error",
        message: result.message || "Não foi possível consultar sua posição agora."
      });
      return;
    }

    setFeedback(applyWaitlistStatus(result, "info"));
  }

  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-porcelain/95 p-4 shadow-soft sm:p-6">
      {recaptchaSiteKey ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
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
                ? "bg-olive-700 text-white shadow-xs"
                : "text-graphite/68 hover:text-graphite"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "signup" ? (
        <form className="mt-6 space-y-4" onSubmit={handleSignup}>
          {/* Campo isca: invisível para pessoas, robôs costumam preencher. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
            <label htmlFor="website">Site</label>
            <input ref={honeypotRef} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
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
              {GOALS.map((goal) => (
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

          <p className="text-center text-sm text-graphite/55">
            Já está na fila?{" "}
            <button
              type="button"
              onClick={() => handleTabChange("lookup")}
              className="font-semibold text-olive-700 hover:text-olive-800"
            >
              Consultar posição
            </button>
          </p>
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

          <p className="text-center text-sm text-graphite/55">
            Ainda não entrou na fila?{" "}
            <button
              type="button"
              onClick={() => handleTabChange("signup")}
              className="font-semibold text-olive-700 hover:text-olive-800"
            >
              Fazer cadastro
            </button>
            {" · "}
            <Link href="/criar-conta" className="font-semibold text-olive-700 hover:text-olive-800">
              Criar conta
            </Link>
          </p>
        </form>
      )}

      <Feedback feedback={feedback} />
    </section>
  );
}
