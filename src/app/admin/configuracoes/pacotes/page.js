"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary, btnSecondary, formatCurrency } from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useDialog } from "@/components/ui/ConfirmDialog";
import { centsToReais, formatReais, parseReaisInput, reaisToCents } from "@/lib/money";
import { packageSavings, perSessionCents, priceFromDiscount } from "@/lib/packages/pricing";
import PixCodeField from "@/components/ui/PixCodeField";
import { describePixCode } from "@/lib/payments/pix-brcode";
import { CardPriceFields } from "@/components/ui/PaymentPriceFields";
import { isValidPaymentLink, packagePaymentOptions, pickOption } from "@/lib/payments/card";

const inputClass =
  "mt-1 w-full rounded-xl border border-olive-900/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-olive-500 focus:ring-2 focus:ring-olive-200";

const EMPTY_FORM = { id: null, name: "", description: "", sessions: 4, priceReais: 0, active: true, pixCode: "", cardReais: 0, cardLink: "" };

function PackageForm({ initial, regularPriceCents, cardFeePercent, onCancel, onSaved }) {
  const [form, setForm] = useState(initial);
  const [discount, setDiscount] = useState(() => {
    const { discountPercent } = packageSavings(
      { sessions: initial.sessions, price_cents: reaisToCents(initial.priceReais) },
      regularPriceCents
    );
    return discountPercent;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const priceCents = reaisToCents(form.priceReais);
  const preview = { sessions: Number(form.sessions) || 0, price_cents: priceCents };
  const savings = packageSavings(preview, regularPriceCents);

  function setSessions(value) {
    const sessions = Math.max(0, Math.min(50, Number(String(value).replace(/\D/g, "")) || 0));
    setForm((current) => ({
      ...current,
      sessions,
      priceReais: regularPriceCents && discount ? centsToReais(priceFromDiscount(sessions, regularPriceCents, discount)) : current.priceReais
    }));
  }

  function setDiscountPercent(value) {
    const pct = Math.max(0, Math.min(90, Number(String(value).replace(/\D/g, "")) || 0));
    setDiscount(pct);
    if (regularPriceCents) {
      setForm((current) => ({
        ...current,
        priceReais: centsToReais(priceFromDiscount(current.sessions, regularPriceCents, pct))
      }));
    }
  }

  function setPrice(reais) {
    setForm((current) => ({ ...current, priceReais: reais }));
    setDiscount(packageSavings({ sessions: form.sessions, price_cents: reaisToCents(reais) }, regularPriceCents).discountPercent);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(form.id ? `/api/admin/packages/${form.id}` : "/api/admin/packages", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        sessions: Number(form.sessions),
        priceCents,
        active: form.active,
        pixCode: form.pixCode || null,
        cardPriceCents: reaisToCents(form.cardReais) || null,
        cardLink: form.cardLink.trim() || null
      })
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.message || "Não foi possível salvar.");
      return;
    }
    onSaved(data.warning);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium text-graphite">
        Nome do pacote
        <input
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex.: Acompanhamento trimestral"
          required
          minLength={2}
        />
      </label>
      <label className="block text-sm font-medium text-graphite">
        Descrição <span className="font-normal text-graphite/45">(opcional)</span>
        <textarea
          className={inputClass}
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Ex.: 4 consultas, uma por mês."
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium text-graphite">
          Consultas
          <input className={inputClass} inputMode="numeric" value={form.sessions} onChange={(e) => setSessions(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-graphite">
          Desconto
          <div className="relative">
            <input
              className={`${inputClass} pr-8`}
              inputMode="numeric"
              value={discount}
              onChange={(e) => setDiscountPercent(e.target.value)}
              disabled={!regularPriceCents}
            />
            <span className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-sm text-graphite/45">%</span>
          </div>
        </label>
        <label className="block text-sm font-medium text-graphite">
          Preço do pacote
          <input
            className={inputClass}
            inputMode="numeric"
            value={formatReais(form.priceReais)}
            onChange={(e) => setPrice(parseReaisInput(e.target.value))}
          />
        </label>
      </div>

      <div className="rounded-2xl bg-olive-50/70 px-4 py-3 text-sm text-graphite/75">
        {regularPriceCents ? (
          <>
            {preview.sessions} consultas avulsas: <span className="line-through">{formatCurrency(savings.regularTotalCents)}</span>
            {" · "}no pacote: <strong className="text-graphite">{formatCurrency(priceCents)}</strong>
            {" · "}
            {formatCurrency(perSessionCents(preview))} por consulta
            {savings.savingsCents ? (
              <span className="mt-1 block font-semibold text-olive-800">
                O paciente economiza {formatCurrency(savings.savingsCents)} ({savings.discountPercent}%).
              </span>
            ) : (
              <span className="mt-1 block text-amber-800">Sem desconto em relação à consulta avulsa.</span>
            )}
          </>
        ) : (
          "Cadastre o valor da consulta em Pagamento para o desconto ser calculado automaticamente."
        )}
      </div>

      <PixCodeField
        label="PIX copia e cola do pacote"
        value={form.pixCode}
        onChange={(value) => setForm((current) => ({ ...current, pixCode: value }))}
        expectedCents={priceCents}
        hint="Opcional. Gere no banco um PIX com o valor do pacote e cole aqui."
      />

      <div className="rounded-2xl border border-olive-900/10 bg-white/60 p-4">
        <p className="mb-3 text-sm font-semibold text-graphite">Cartão de crédito</p>
        <CardPriceFields
          pixCents={priceCents}
          feePercent={cardFeePercent}
          cardReais={form.cardReais}
          onCardReais={(value) => setForm((current) => ({ ...current, cardReais: value }))}
          link={form.cardLink}
          onLink={(value) => setForm((current) => ({ ...current, cardLink: value }))}
          linkLabel="Link de pagamento do pacote"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-graphite">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        Disponível para os pacientes contratarem
      </label>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      <div className="flex flex-col-reverse gap-2 border-t border-olive-900/10 pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className={btnSecondary()}>
          Cancelar
        </button>
        <button type="submit" disabled={saving || !form.name.trim() || form.sessions < 2 || describePixCode(form.pixCode, priceCents).tone === "error" || !isValidPaymentLink(form.cardLink)} className={btnPrimary()}>
          {saving ? "Salvando…" : form.id ? "Salvar pacote" : "Criar pacote"}
        </button>
      </div>
    </form>
  );
}

export default function PacotesConfigPage() {
  const { confirm } = useDialog();
  const [packages, setPackages] = useState([]);
  const [regularPriceCents, setRegularPriceCents] = useState(0);
  const [cardFeePercent, setCardFeePercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/packages");
    const data = await res.json().catch(() => ({}));
    setPackages(data.packages || []);
    setRegularPriceCents(data.regularPriceCents || 0);
    setCardFeePercent(Number(data.cardFeePercent) || 0);
    setError(data.needsMigration ? data.message : res.ok ? "" : data.message || "Erro ao carregar.");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setFeedback("");
    setEditing({
      ...EMPTY_FORM,
      priceReais: regularPriceCents ? centsToReais(priceFromDiscount(4, regularPriceCents, 15)) : 0
    });
  }

  function openEdit(pkg) {
    setFeedback("");
    setEditing({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description || "",
      sessions: pkg.sessions,
      priceReais: centsToReais(pkg.price_cents),
      active: pkg.active,
      pixCode: pkg.pix_code || "",
      cardReais: centsToReais(pkg.card_price_cents),
      cardLink: pkg.card_link || ""
    });
  }

  async function remove(pkg) {
    const ok = await confirm({
      title: `Excluir o pacote “${pkg.name}”?`,
      message: "Quem já contratou continua com as consultas do pacote. Ele só deixa de ser oferecido.",
      confirmLabel: "Excluir",
      tone: "danger"
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/packages/${pkg.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message || "Não foi possível excluir.");
      return;
    }
    setFeedback("Pacote excluído.");
    load();
  }

  return (
    <AdminShell
      title="Pacotes"
      subtitle="Combos de consultas com desconto"
      breadcrumbs={["Admin", "Configurações", "Pacotes"]}
      userName="Letícia"
    >
      {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
      {feedback ? (
        <p className="mb-4 rounded-xl border border-olive-200 bg-olive-50 px-4 py-3 text-sm text-olive-900">{feedback}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-graphite/60">
          O paciente contrata o pacote na área dele e paga como uma consulta normal. Depois que você confirma o
          pagamento, cada consulta marcada usa um crédito do pacote automaticamente.
        </p>
        <button type="button" onClick={openNew} className={btnPrimary()}>
          <Plus className="h-4 w-4" />
          Novo pacote
        </button>
      </div>

      {loading ? (
        <Card>
          <p className="text-sm text-graphite/55">Carregando…</p>
        </Card>
      ) : !packages.length ? (
        <Card>
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-olive-100 text-olive-800">
              <Package className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <p className="mt-3 font-semibold text-graphite">Nenhum pacote ainda</p>
            <p className="mt-1 max-w-sm text-sm text-graphite/55">
              Crie um combo, por exemplo 4 consultas com 15% de desconto.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => {
            const savings = packageSavings(pkg, regularPriceCents);
            return (
              <Card key={pkg.id} className={pkg.active ? "" : "opacity-70"}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words font-semibold text-graphite">{pkg.name}</h2>
                    <p className="mt-0.5 text-sm text-graphite/55">{pkg.sessions} consultas</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {savings.discountPercent ? <Badge variant="success">-{savings.discountPercent}%</Badge> : null}
                    {!pkg.active ? <Badge variant="neutral">Oculto</Badge> : null}
                    {pkg.pix_code ? (
                      describePixCode(pkg.pix_code, pkg.price_cents).tone === "success" ? (
                        <Badge variant="info">PIX</Badge>
                      ) : (
                        <Badge variant="warning">PIX com valor errado</Badge>
                      )
                    ) : null}
                    {pkg.card_link ? <Badge variant="info">Cartão</Badge> : null}
                  </div>
                </div>
                {pkg.description ? <p className="mt-3 text-sm leading-6 text-graphite/65">{pkg.description}</p> : null}
                <p className="mt-4 text-2xl font-semibold text-graphite">
                  {formatCurrency(pkg.price_cents)} <span className="text-sm font-medium text-graphite/50">no PIX</span>
                </p>
                {pkg.card_link ? (
                  <p className="text-sm text-graphite/60">
                    {formatCurrency(pickOption(packagePaymentOptions(pkg, { card_fee_percent: cardFeePercent }), "card").cents)} no cartão
                  </p>
                ) : null}
                <p className="text-xs text-graphite/50">
                  {formatCurrency(perSessionCents(pkg))} por consulta
                  {savings.savingsCents ? ` · economia de ${formatCurrency(savings.savingsCents)}` : ""}
                </p>
                <div className="mt-4 flex gap-2 border-t border-olive-900/10 pt-4">
                  <button type="button" onClick={() => openEdit(pkg)} className={btnSecondary()}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(pkg)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? "Editar pacote" : "Novo pacote"} size="md">
        {editing ? (
          <PackageForm
            key={editing.id || "new"}
            initial={editing}
            regularPriceCents={regularPriceCents}
            cardFeePercent={cardFeePercent}
            onCancel={() => setEditing(null)}
            onSaved={(warning) => {
              setEditing(null);
              setFeedback(warning ? `Pacote salvo. ${warning}` : "Pacote salvo.");
              load();
            }}
          />
        ) : null}
      </Modal>
    </AdminShell>
  );
}
