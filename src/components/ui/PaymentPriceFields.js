"use client";

// Campos de preço (reais inteiros) e de cartão: parcelas e taxa do produto,
// preço sugerido pela taxa e link de pagamento.

import { Sparkles } from "lucide-react";
import { formatCurrency, inputClassName } from "@/components/layout/AppShell";
import { centsToReais, formatReais, parseReaisInput, reaisToCents } from "@/lib/money";
import { isValidPaymentLink, suggestCardPriceCents } from "@/lib/payments/card";

export function MoneyReaisField({ label, value, onChange, hint }) {
  return (
    <label className="block text-sm font-medium text-graphite">
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
        className={inputClassName("mt-1")}
      />
      {hint ? <span className="mt-1 block text-xs font-normal text-graphite/50">{hint}</span> : null}
    </label>
  );
}

/** "6,99" → 6.99; vazio → null. */
export function parseFeeText(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? Math.min(30, Math.max(0, n)) : null;
}

export function feeToText(value) {
  return value === null || value === undefined || value === "" ? "" : String(Number(value)).replace(".", ",");
}

// Parcelas e taxa do cartão de um produto (cada parcelamento tem a sua taxa no banco).
export function CardTermsFields({ installments, onInstallments, feeText, onFeeText }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <label className="block text-sm font-medium text-graphite">
        Parcelas
        <select
          value={installments}
          onChange={(event) => onInstallments(Number(event.target.value))}
          className={inputClassName("mt-1")}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n === 1 ? "Só à vista" : `Em até ${n}x`}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-graphite">
        Taxa (%)
        <input
          type="text"
          inputMode="decimal"
          value={feeText}
          onChange={(event) => onFeeText(event.target.value.replace(/[^\d,.]/g, "").slice(0, 5))}
          placeholder="Ex.: 6,99"
          className={inputClassName("mt-1")}
        />
      </label>
      <span className="col-span-2 -mt-2 block text-xs font-normal text-graphite/50">
        A taxa que o banco cobra no link com esse parcelamento. O preço no cartão é sugerido a partir dela.
      </span>
    </div>
  );
}

// Preço no cartão com sugestão pela taxa e botão para usar a sugestão.
export function CardPriceFields({ pixCents, feePercent, cardReais, onCardReais, link, onLink, linkLabel, stacked = false }) {
  const suggested = suggestCardPriceCents(pixCents, feePercent);
  const cardCents = reaisToCents(cardReais);
  const differs = cardCents && cardCents !== suggested;
  const linkOk = isValidPaymentLink(link);

  return (
    <div className={`grid gap-4 ${stacked ? "" : "sm:grid-cols-2"}`}>
      <div>
        <MoneyReaisField
          label="Preço no cartão"
          value={cardReais}
          onChange={onCardReais}
          hint={
            !cardCents
              ? `Vazio = sugerido pela taxa: ${formatCurrency(suggested)}`
              : differs
                ? `Sugerido pela taxa: ${formatCurrency(suggested)}`
                : "Igual ao sugerido pela taxa."
          }
        />
        {differs || !cardCents ? (
          <button
            type="button"
            onClick={() => onCardReais(centsToReais(suggested))}
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-olive-800 hover:underline"
          >
            <Sparkles className="h-3 w-3" />
            Usar {formatCurrency(suggested)}
          </button>
        ) : null}
      </div>
      <label className="block text-sm font-medium text-graphite">
        {linkLabel || "Link de pagamento (cartão)"}
        <input
          type="url"
          inputMode="url"
          value={link || ""}
          onChange={(event) => onLink(event.target.value)}
          placeholder="https://…"
          className={inputClassName(`mt-1 ${linkOk ? "" : "!border-rose-300"}`)}
        />
        <span className={`mt-1 block text-xs font-normal ${linkOk ? "text-graphite/50" : "text-rose-700"}`}>
          {linkOk
            ? "Crie o link na maquininha/banco com o mesmo valor do preço no cartão. Sem link, só o PIX aparece."
            : "O link precisa começar com https://"}
        </span>
      </label>
    </div>
  );
}
