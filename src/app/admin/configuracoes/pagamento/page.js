"use client";

// Valores e formas de pagamento: PIX (mais barato) e cartão de crédito por link,
// com a taxa do cartão repassada ao paciente.

import { useEffect, useMemo, useState } from "react";
import { CreditCard, QrCode } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary, formatCurrency, inputClassName } from "@/components/layout/AppShell";
import PixCodeField from "@/components/ui/PixCodeField";
import {
  CardPriceFields,
  CardTermsFields,
  MoneyReaisField,
  feeToText,
  parseFeeText
} from "@/components/ui/PaymentPriceFields";
import { centsToReais, reaisToCents } from "@/lib/money";
import {
  clampInstallments,
  effectiveFeePercent,
  effectiveInstallments,
  installmentCents,
  isValidPaymentLink,
  suggestCardPriceCents
} from "@/lib/payments/card";

export default function PagamentoConfigPage() {
  const [settings, setSettings] = useState({
    consultationPriceReais: 0,
    consultationPixCode: "",
    consultationCardReais: 0,
    consultationCardLink: "",
    consultationCardFee: "",
    consultationCardInstallments: 1,
    instructions: "",
    cancellationPolicy: ""
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ tone: "", text: "" });

  useEffect(() => {
    fetch("/api/admin/payment-settings")
      .then((r) => r.json())
      .then((data) => {
        const s = data.settings;
        if (!s) return;
        setSettings({
          consultationPriceReais: centsToReais(s.consultation_price_cents),
          consultationPixCode: s.consultation_pix_code || "",
          consultationCardReais: centsToReais(s.consultation_card_price_cents),
          consultationCardLink: s.consultation_card_link || "",
          // Sem taxa/parcelas próprias da consulta, parte da configuração geral antiga.
          consultationCardFee: feeToText(
            s.consultation_card_fee_percent ?? (Number(s.card_fee_percent) ? s.card_fee_percent : null)
          ),
          consultationCardInstallments: effectiveInstallments(s.consultation_card_installments, s.card_max_installments),
          instructions: s.instructions || "",
          cancellationPolicy: s.cancellation_policy || ""
        });
      })
      .catch(() => {});
  }, []);

  const set = (key) => (value) => setSettings((current) => ({ ...current, [key]: value }));
  const feePercent = effectiveFeePercent(parseFeeText(settings.consultationCardFee), 0);
  const pixCents = reaisToCents(settings.consultationPriceReais);
  const cardCents = reaisToCents(settings.consultationCardReais) || suggestCardPriceCents(pixCents, feePercent);
  const installments = clampInstallments(settings.consultationCardInstallments);
  const preview = useMemo(
    () => ({ extra: Math.max(0, cardCents - pixCents), each: installmentCents(cardCents, installments) }),
    [cardCents, pixCents, installments]
  );

  async function save() {
    if (!isValidPaymentLink(settings.consultationCardLink)) {
      setFeedback({ tone: "error", text: "O link do cartão precisa começar com https://." });
      return;
    }
    setSaving(true);
    setFeedback({ tone: "", text: "" });
    const res = await fetch("/api/admin/payment-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationPriceCents: pixCents,
        consultationPixCode: settings.consultationPixCode || null,
        consultationCardPriceCents: reaisToCents(settings.consultationCardReais) || null,
        consultationCardLink: settings.consultationCardLink.trim() || null,
        consultationCardFeePercent: parseFeeText(settings.consultationCardFee),
        consultationCardInstallments: installments,
        instructions: settings.instructions,
        cancellationPolicy: settings.cancellationPolicy
      })
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setFeedback({ tone: "error", text: data.message || "Erro ao salvar." });
      return;
    }
    setFeedback(
      data.warning
        ? { tone: "warning", text: `Valores salvos. ${data.warning}` }
        : { tone: "success", text: "Configurações salvas." }
    );
  }

  const feedbackClass = {
    success: "border-olive-200 bg-olive-50 text-olive-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-rose-200 bg-rose-50 text-rose-800"
  }[feedback.tone];

  return (
    <AdminShell
      title="Pagamento"
      subtitle="PIX com o melhor preço e cartão de crédito com a taxa repassada"
      breadcrumbs={["Admin", "Configurações", "Pagamento"]}
      userName="Letícia"
    >
      <p className="mb-4 max-w-3xl text-sm leading-6 text-graphite/60">
        O paciente escolhe entre PIX e cartão. No cartão, o preço inclui a taxa do link de pagamento, para você receber o
        mesmo valor do PIX. Cada produto tem as próprias parcelas e a própria taxa: a consulta aqui, os planos em Pacotes.
      </p>

      <Card className="mb-4" title="Consulta">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-olive-900/10 bg-white/60 p-4">
            <p className="flex items-center gap-2 font-semibold text-graphite">
              <QrCode className="h-4 w-4 text-olive-700" /> PIX
            </p>
            <MoneyReaisField
              label="Preço no PIX"
              value={settings.consultationPriceReais}
              onChange={set("consultationPriceReais")}
              hint="O valor da consulta. É o mais barato."
            />
            <PixCodeField
              label="PIX copia e cola"
              value={settings.consultationPixCode}
              onChange={set("consultationPixCode")}
              expectedCents={pixCents}
            />
          </div>
          <div className="space-y-4 rounded-2xl border border-olive-900/10 bg-white/60 p-4">
            <p className="flex items-center gap-2 font-semibold text-graphite">
              <CreditCard className="h-4 w-4 text-olive-700" /> Cartão de crédito
            </p>
            <CardTermsFields
              installments={installments}
              onInstallments={set("consultationCardInstallments")}
              feeText={settings.consultationCardFee}
              onFeeText={set("consultationCardFee")}
            />
            <CardPriceFields
              pixCents={pixCents}
              feePercent={feePercent}
              cardReais={settings.consultationCardReais}
              onCardReais={set("consultationCardReais")}
              link={settings.consultationCardLink}
              onLink={set("consultationCardLink")}
              stacked
            />
            <p className="rounded-xl bg-linen/70 px-3 py-2 text-xs leading-5 text-graphite/65">
              O paciente vê: <strong className="text-graphite">PIX {formatCurrency(pixCents)}</strong> ou{" "}
              <strong className="text-graphite">cartão {formatCurrency(cardCents)}</strong>
              {installments > 1 ? ` (em até ${installments}x de ${formatCurrency(preview.each)})` : ""}
              {preview.extra ? ` · ${formatCurrency(preview.extra)} a mais no cartão` : ""}.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-4" title="Textos para o paciente">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block text-sm font-medium text-graphite">
            Instruções de pagamento
            <textarea
              value={settings.instructions}
              onChange={(e) => set("instructions")(e.target.value)}
              className={inputClassName("mt-1")}
              rows={3}
              placeholder="Ex.: Depois de pagar, envie o comprovante em Minhas consultas."
            />
          </label>
          <label className="block text-sm font-medium text-graphite">
            Política de cancelamento
            <textarea
              value={settings.cancellationPolicy}
              onChange={(e) => set("cancellationPolicy")(e.target.value)}
              className={inputClassName("mt-1")}
              rows={3}
              placeholder="Ex.: Cancelamentos com pelo menos 24h de antecedência."
            />
          </label>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={save} disabled={saving} className={btnPrimary()}>
          {saving ? "Salvando…" : "Salvar configurações"}
        </button>
        {feedback.text ? (
          <p className={`rounded-xl border px-3 py-2 text-sm ${feedbackClass}`}>{feedback.text}</p>
        ) : null}
      </div>
    </AdminShell>
  );
}
