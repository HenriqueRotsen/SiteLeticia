"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { Card } from "@/components/layout/AppShell";
import { centsToReais, formatReais, parseReaisInput, reaisToCents } from "@/lib/money";

function MoneyReaisField({ label, value, onChange, placeholder }) {
  return (
    <label className="text-sm">
      {label}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatReais(value)}
        onChange={(event) => onChange(parseReaisInput(event.target.value))}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            onChange((Number(value) || 0) + 1);
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            onChange(Math.max(0, (Number(value) || 0) - 1));
          }
        }}
        className="mt-1 w-full rounded-xl border px-3 py-2"
        placeholder={placeholder}
      />
      <span className="mt-1 block text-xs text-graphite/45">Valor em reais (de R$ 1 em R$ 1)</span>
    </label>
  );
}

export default function PagamentoConfigPage() {
  const [settings, setSettings] = useState({
    consultationPriceReais: 0,
    returnPriceReais: null,
    instructions: "",
    cancellationPolicy: ""
  });
  const [methods, setMethods] = useState([]);
  const [methodForm, setMethodForm] = useState({
    type: "pix",
    label: "PIX",
    details: { pixKey: "" },
    active: true,
    sortOrder: 0
  });
  const [feedback, setFeedback] = useState("");

  async function load() {
    const [s, m] = await Promise.all([
      fetch("/api/admin/payment-settings").then((r) => r.json()),
      fetch("/api/admin/payment-methods").then((r) => r.json())
    ]);
    if (s.settings) {
      setSettings({
        consultationPriceReais: centsToReais(s.settings.consultation_price_cents),
        returnPriceReais:
          s.settings.return_price_cents == null
            ? null
            : centsToReais(s.settings.return_price_cents),
        instructions: s.settings.instructions || "",
        cancellationPolicy: s.settings.cancellation_policy || ""
      });
    }
    setMethods(m.methods || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSettings() {
    const res = await fetch("/api/admin/payment-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationPriceCents: reaisToCents(settings.consultationPriceReais),
        returnPriceCents:
          settings.returnPriceReais == null || settings.returnPriceReais === ""
            ? null
            : reaisToCents(settings.returnPriceReais),
        instructions: settings.instructions,
        cancellationPolicy: settings.cancellationPolicy
      })
    });
    setFeedback(res.ok ? "Configurações salvas." : "Erro ao salvar.");
  }

  async function addMethod() {
    const res = await fetch("/api/admin/payment-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(methodForm)
    });
    if (res.ok) {
      setMethodForm({ type: "pix", label: "PIX", details: { pixKey: "" }, active: true, sortOrder: 0 });
      load();
    }
  }

  return (
    <AdminShell title="Pagamento" breadcrumbs={["Admin", "Configurações", "Pagamento"]} userName="Letícia">
      <Card className="mb-4">
        <h2 className="font-semibold">Valores</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MoneyReaisField
            label="Consulta (R$)"
            value={settings.consultationPriceReais}
            onChange={(value) => setSettings((c) => ({ ...c, consultationPriceReais: value }))}
            placeholder="R$ 0"
          />
          <MoneyReaisField
            label="Retorno (R$)"
            value={settings.returnPriceReais ?? 0}
            onChange={(value) =>
              setSettings((c) => ({ ...c, returnPriceReais: value === 0 ? null : value }))
            }
            placeholder="R$ 0"
          />
        </div>
        <textarea
          value={settings.instructions}
          onChange={(e) => setSettings((c) => ({ ...c, instructions: e.target.value }))}
          className="mt-3 w-full rounded-xl border px-3 py-2"
          rows={3}
          placeholder="Instruções de pagamento"
        />
        <textarea
          value={settings.cancellationPolicy}
          onChange={(e) => setSettings((c) => ({ ...c, cancellationPolicy: e.target.value }))}
          className="mt-3 w-full rounded-xl border px-3 py-2"
          rows={3}
          placeholder="Política de cancelamento"
        />
        <button type="button" onClick={saveSettings} className="mt-4 rounded-xl bg-olive-700 px-4 py-2 text-white">
          Salvar configurações
        </button>
        {feedback ? <p className="mt-2 text-sm">{feedback}</p> : null}
      </Card>

      <Card>
        <h2 className="font-semibold">Formas de pagamento</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={methodForm.label}
            onChange={(e) => setMethodForm((c) => ({ ...c, label: e.target.value }))}
            className="rounded-xl border px-3 py-2"
            placeholder="Nome (ex: PIX)"
          />
          <input
            value={methodForm.details.pixKey || ""}
            onChange={(e) =>
              setMethodForm((c) => ({ ...c, details: { ...c.details, pixKey: e.target.value } }))
            }
            className="rounded-xl border px-3 py-2"
            placeholder="Chave PIX"
          />
        </div>
        <button type="button" onClick={addMethod} className="mt-4 rounded-xl border px-4 py-2">
          Adicionar forma
        </button>
        <ul className="mt-4 space-y-2 text-sm">
          {methods.map((m) => (
            <li key={m.id} className="rounded-xl bg-white/70 px-3 py-2">
              {m.label} {m.details?.pixKey ? `· ${m.details.pixKey}` : ""}
            </li>
          ))}
        </ul>
      </Card>
    </AdminShell>
  );
}
