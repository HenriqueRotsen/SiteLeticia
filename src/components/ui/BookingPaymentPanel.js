"use client";

// Resumo do agendamento: valor, escolha entre PIX e cartão, PIX copia e cola e textos da Letícia.

import { Check, CreditCard, Info, QrCode, Receipt, ShieldCheck } from "lucide-react";
import PixPayment from "@/components/ui/PixPayment";
import { btnPrimary, formatCurrency } from "@/components/layout/AppShell";
import { cardExtraCents, pickOption } from "@/lib/payments/card";
import { pixCodeForAmount } from "@/lib/payments/pix-brcode";

// Escolha PIX x cartão. `options` vem de consultationPaymentOptions / packagePaymentOptions.
export function PaymentMethodChoice({ options, value, onChange }) {
  if (!options || options.length < 2) return null;
  const pix = pickOption(options, "pix");
  const card = pickOption(options, "card");
  const extra = cardExtraCents(pix.cents, card.cents);

  const item = (option, Icon, title, detail, badge) => {
    const active = value === option.method;
    return (
      <button
        key={option.method}
        type="button"
        onClick={() => onChange(option.method)}
        aria-pressed={active}
        className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
          active ? "border-olive-700 bg-olive-50 ring-2 ring-olive-200" : "border-olive-900/10 bg-white hover:border-olive-400"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            active ? "bg-olive-700 text-white" : "bg-linen text-olive-800"
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.85} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-graphite">{title}</span>
            {badge ? (
              <span className="rounded-full bg-olive-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-olive-800">
                {badge}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-sm font-semibold text-graphite">{formatCurrency(option.cents)}</span>
          <span className="block text-xs leading-5 text-graphite/55">{detail}</span>
        </span>
        {active ? <Check className="mt-1 h-4 w-4 shrink-0 text-olive-700" /> : null}
      </button>
    );
  };

  return (
    <div className="space-y-2" role="group" aria-label="Forma de pagamento">
      {item(pix, QrCode, "PIX", "QR code ou copia e cola, na hora.", extra ? "Mais barato" : null)}
      {item(
        card,
        CreditCard,
        "Cartão de crédito",
        `${card.installments > 1 ? `Em até ${card.installments}x de ${formatCurrency(card.installmentCents)} · ` : ""}pelo link de pagamento${
          extra ? ` (taxa do cartão: +${formatCurrency(extra)})` : ""
        }.`
      )}
    </div>
  );
}

export default function BookingPaymentPanel({
  payment,
  options = [],
  method = "pix",
  onMethodChange,
  coveredByPackage = null,
  selectedSummary,
  loading,
  disabled,
  feedback,
  onConfirm,
  confirmLabel = "Confirmar agendamento"
}) {
  const settings = payment.settings || {};
  const chosen = pickOption(options, method);
  // Só mostra o QR se o valor do PIX copia e cola bater com o da consulta.
  const pixCode = chosen?.method === "pix" ? pixCodeForAmount(chosen.pixCode, chosen.cents) : null;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-olive-700 to-olive-800 p-5 text-white shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-olive-100">Valor da consulta</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {coveredByPackage ? "Pacote" : formatCurrency(chosen?.cents ?? settings.consultation_price_cents)}
            </p>
            <p className="mt-2 text-xs text-olive-100/80">
              {coveredByPackage
                ? `Usa 1 consulta do pacote “${coveredByPackage}”.`
                : `Sessão de 60 minutos${chosen?.method === "card" ? " · no cartão" : options.length > 1 ? " · no PIX" : ""}`}
            </p>
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

      {!coveredByPackage && options.length > 1 ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-graphite">Como prefere pagar?</p>
          <PaymentMethodChoice options={options} value={method} onChange={onMethodChange} />
        </div>
      ) : null}

      {!coveredByPackage && pixCode ? (
        <PixPayment code={pixCode} amountCents={chosen.cents} title="PIX da consulta" compact />
      ) : null}

      {!coveredByPackage && chosen?.method === "card" ? (
        <p className="rounded-2xl border border-olive-900/10 bg-white p-4 text-sm leading-6 text-graphite/70">
          Depois de confirmar, o botão <strong className="text-graphite">Pagar no cartão</strong> aparece na sua
          consulta. A Letícia confirma o pagamento assim que ele cair.
        </p>
      ) : null}

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

      <button type="button" disabled={disabled || loading} onClick={onConfirm} className={btnPrimary("w-full py-3.5")}>
        {loading ? "Agendando..." : confirmLabel}
      </button>

      {feedback ? (
        <p className="rounded-xl border border-olive-200 bg-olive-50 px-4 py-3 text-sm text-olive-800">{feedback}</p>
      ) : null}
    </div>
  );
}
