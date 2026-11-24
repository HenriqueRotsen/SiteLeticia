"use client";

// Campos de preço (reais inteiros) e de cartão (preço sugerido pela taxa + link de pagamento).

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
