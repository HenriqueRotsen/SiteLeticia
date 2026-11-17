"use client";

// QR code + PIX copia e cola com o valor exato do produto.

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, QrCode } from "lucide-react";
import { formatCurrency } from "@/components/layout/AppShell";

export default function PixPayment({ code, amountCents, title = "Pague com PIX", compact = false }) {
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    if (!code) return undefined;
    QRCode.toDataURL(code, { margin: 1, width: 480, errorCorrectionLevel: "M", color: { dark: "#2F2A27", light: "#FFFFFF" } })
      .then((url) => active && setQr(url))
      .catch(() => active && setQr(""));
    return () => {
      active = false;
    };
  }, [code]);

  if (!code) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const area = document.createElement("textarea");
      area.value = code;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="rounded-2xl border border-olive-900/10 bg-white p-4">
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-olive-700" strokeWidth={1.75} />
        <p className="text-sm font-semibold text-graphite">{title}</p>
        {amountCents ? <span className="ml-auto text-sm font-semibold text-olive-800">{formatCurrency(amountCents)}</span> : null}
      </div>
      <div className={`mt-3 flex ${compact ? "flex-col items-center" : "flex-col items-center sm:flex-row sm:items-start"} gap-4`}>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt="QR code do PIX"
            className="h-44 w-44 shrink-0 rounded-xl border border-olive-900/10"
          />
        ) : (
          <div className="h-44 w-44 shrink-0 animate-pulse rounded-xl bg-linen" />
        )}
        <div className="w-full min-w-0 flex-1">
          <p className="text-xs leading-5 text-graphite/55">
            Abra o app do seu banco, escolha pagar com PIX e leia o QR code. Ou copie o código abaixo e cole em
            &quot;PIX copia e cola&quot;.
          </p>
          <code className="mt-2 block max-h-20 overflow-y-auto break-all rounded-xl bg-linen px-3 py-2 text-[11px] leading-4 text-graphite/80">
            {code}
          </code>
          <button
            type="button"
            onClick={copy}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-olive-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-800"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Código copiado" : "Copiar código PIX"}
          </button>
        </div>
      </div>
    </div>
  );
}
