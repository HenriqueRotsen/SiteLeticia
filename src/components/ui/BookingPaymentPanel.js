"use client";

import { useState } from "react";
import {
  Banknote,
  Check,
  Copy,
  CreditCard,
  Info,
  QrCode,
  Receipt,
  ShieldCheck
} from "lucide-react";
import { btnPrimary, formatCurrency } from "@/components/layout/AppShell";

const methodIcons = {
  pix: QrCode,
  cash: Banknote,
  card: CreditCard
};

function PaymentMethodCard({ method }) {
  const [copied, setCopied] = useState(false);
  const Icon = methodIcons[method.type] || CreditCard;
  const pixKey = method.details?.pixKey;

  async function copyPixKey() {
    if (!pixKey) return;
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-olive-900/10 bg-white">
      <div className="flex items-center gap-3 border-b border-olive-900/5 bg-linen/60 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-graphite">{method.label}</p>
          {method.details?.instructions ? (
            <p className="text-xs text-graphite/50">{method.details.instructions}</p>
          ) : null}
        </div>
        {method.type === "pix" ? (
          <span className="rounded-full bg-olive-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-olive-800">
            Preferencial
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        {pixKey ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-graphite/45">Chave PIX</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-xl bg-linen px-3 py-2 text-sm text-graphite">
                {pixKey}
              </code>
              <button
                type="button"
                onClick={copyPixKey}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-olive-900/10 bg-white px-3 py-2 text-xs font-semibold text-olive-700 transition hover:bg-olive-50"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        ) : null}

        {!pixKey && method.details?.instructions ? (
          <p className="text-sm leading-6 text-graphite/65">{method.details.instructions}</p>
        ) : null}
      </div>
    </article>
  );
}

export default function BookingPaymentPanel({
  payment,
  selectedSummary,
  loading,
  disabled,
  feedback,
  onConfirm,
  confirmLabel = "Confirmar agendamento"
}) {
  const settings = payment.settings || {};
  const methods = payment.methods || [];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-olive-700 to-olive-800 p-5 text-white shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-olive-100">Valor da consulta</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {formatCurrency(settings.consultation_price_cents)}
            </p>
            <p className="mt-2 text-xs text-olive-100/80">Sessão de 60 minutos</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Receipt className="h-6 w-6" strokeWidth={1.75} />
          </div>
        </div>
      </div>

      {selectedSummary ? (
        <div className="rounded-2xl border border-olive-200 bg-olive-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-olive-700">Horário escolhido</p>
          <p className="mt-2 text-sm font-semibold text-graphite">{selectedSummary.day}</p>
          <p className="mt-1 text-2xl font-semibold text-olive-800">{selectedSummary.time}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-olive-300/70 bg-linen/70 px-4 py-5 text-center">
          <p className="text-sm font-medium text-graphite">Selecione um horário</p>
          <p className="mt-1 text-xs text-graphite/50">O resumo aparecerá aqui antes de confirmar.</p>
        </div>
      )}

      <div>
        <p className="mb-3 text-sm font-semibold text-graphite">Formas de pagamento</p>
        <div className="space-y-3">
          {methods.map((method) => (
            <PaymentMethodCard key={method.id} method={method} />
          ))}
        </div>
      </div>

      {settings.instructions ? (
        <div className="flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
          <div>
            <p className="text-sm font-semibold text-amber-950">Como pagar</p>
            <p className="mt-1 text-sm leading-6 text-amber-950/85">{settings.instructions}</p>
          </div>
        </div>
      ) : null}

      {settings.cancellation_policy ? (
        <div className="flex gap-3 rounded-2xl border border-olive-900/10 bg-white p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-olive-700" />
          <div>
            <p className="text-sm font-semibold text-graphite">Cancelamento</p>
            <p className="mt-1 text-sm leading-6 text-graphite/60">{settings.cancellation_policy}</p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={disabled || loading}
        onClick={onConfirm}
        className={btnPrimary("w-full py-3.5")}
      >
        {loading ? "Agendando..." : confirmLabel}
      </button>

      {feedback ? (
        <p className="rounded-xl border border-olive-200 bg-olive-50 px-4 py-3 text-sm text-olive-800">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
