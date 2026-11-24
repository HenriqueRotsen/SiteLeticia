"use client";

// Pacotes na área do paciente: os que ele tem (com saldo) e os que pode contratar.

import { useCallback, useEffect, useState } from "react";
import { CreditCard, MessageCircle, Package } from "lucide-react";
import { Card, btnPrimary, btnSecondary, formatCurrency } from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { PaymentMethodChoice } from "@/components/ui/BookingPaymentPanel";
import { packagePaymentOptions, pickOption } from "@/lib/payments/card";
import { packageSavings, packageStatusLabel, perSessionCents, remainingSessions } from "@/lib/packages/pricing";
import { site, whatsappLink } from "@/lib/marketing/content";
import { pixCodeForAmount } from "@/lib/payments/pix-brcode";
import PixPayment from "@/components/ui/PixPayment";

export default function PatientPackagesSection() {
  const [data, setData] = useState({ catalog: [], mine: [], regularPriceCents: 0, cardSettings: {} });
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [buying, setBuying] = useState(null);
  const [buyMethod, setBuyMethod] = useState("pix");

  const load = useCallback(async () => {
    const packagesRes = await fetch("/api/packages")
      .then((r) => r.json())
      .catch(() => ({}));
    setData({
      catalog: packagesRes.catalog || [],
      mine: packagesRes.mine || [],
      regularPriceCents: packagesRes.regularPriceCents || 0,
      cardSettings: {
        card_fee_percent: packagesRes.cardFeePercent || 0,
        card_max_installments: packagesRes.cardMaxInstallments || 1
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startBuy(pkg) {
    setBuyMethod("pix");
    setBuying(pkg);
  }

  async function buy() {
    const pkg = buying;
    if (!pkg) return;
    setBuying(null);
    setBusyId(pkg.id);
    setError("");
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: pkg.id, paymentMethod: buyMethod })
    });
    const result = await res.json().catch(() => ({}));
    setBusyId("");
    if (!res.ok) {
      setError(result.message || "Não foi possível contratar.");
      return;
    }
    load();
  }

  const { catalog, mine, regularPriceCents, cardSettings } = data;
  const visibleMine = mine.filter((pkg) => pkg.payment_status !== "cancelled");
  const pending = visibleMine.find((pkg) => pkg.payment_status === "pending");
  const pendingCard = pending?.payment_method === "card" && pending.card_link ? pending.card_link : null;
  const pendingPix = pending && !pendingCard ? pixCodeForAmount(pending.pix_code, pending.price_cents) : null;
  const buyOptions = buying ? packagePaymentOptions(buying, cardSettings) : [];
  const buyChosen = buying ? pickOption(buyOptions, buyMethod) : null;
  if (!catalog.length && !visibleMine.length) return null;

  return (
    <Card className="mt-4" title="Pacotes de consultas">
      {error ? <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      {visibleMine.length ? (
        <ul className="mb-5 space-y-2.5">
          {visibleMine.map((pkg) => {
            const status = packageStatusLabel(pkg);
            return (
              <li key={pkg.id} className="rounded-2xl border border-olive-900/10 bg-linen/30 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-graphite">{pkg.name}</p>
                    <p className="mt-0.5 text-sm text-graphite/60">
                      {pkg.payment_status === "paid"
                        ? `${remainingSessions(pkg)} de ${pkg.sessions_total} consultas disponíveis`
                        : `${pkg.sessions_total} consultas · ${formatCurrency(pkg.price_cents)}`}
                    </p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {pending ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="font-semibold text-amber-950">Falta o pagamento do pacote</p>
          <p className="mt-1 text-sm leading-6 text-amber-900/80">
            Pague {formatCurrency(pending.price_cents)}{" "}
            {pendingCard ? "no cartão pelo link abaixo" : pendingPix ? "com o PIX abaixo" : "combinando com a Letícia"} e envie o
            comprovante. Assim que ela confirmar, suas consultas já saem pagas pelo pacote.
          </p>
          {pendingCard ? (
            <a href={pendingCard} target="_blank" rel="noopener noreferrer" className={`${btnPrimary()} mt-3`}>
              <CreditCard className="h-4 w-4" strokeWidth={1.85} />
              Pagar no cartão
            </a>
          ) : pendingPix ? (
            <div className="mt-3">
              <PixPayment code={pendingPix} amountCents={pending.price_cents} title="PIX do pacote" />
            </div>
          ) : null}
          <a
            href={whatsappLink(site.whatsapp, `Olá, ${site.name}! Contratei o pacote “${pending.name}” e vou enviar o comprovante.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1fb457]"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            Enviar comprovante pelo WhatsApp
          </a>
        </div>
      ) : null}

      {catalog.length ? (
        <>
          <p className="mb-3 text-sm text-graphite/60">Contrate mais consultas de uma vez e pague menos por cada uma.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {catalog.map((pkg) => {
              const savings = packageSavings(pkg, regularPriceCents);
              return (
                <div key={pkg.id} className="flex flex-col rounded-2xl border border-olive-900/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Package className="h-4 w-4 shrink-0 text-olive-700" strokeWidth={1.75} />
                      <p className="break-words font-semibold text-graphite">{pkg.name}</p>
                    </div>
                    {savings.discountPercent ? <Badge variant="success">-{savings.discountPercent}%</Badge> : null}
                  </div>
                  {pkg.description ? <p className="mt-2 text-sm leading-6 text-graphite/60">{pkg.description}</p> : null}
                  <p className="mt-3 text-xl font-semibold text-graphite">
                    {formatCurrency(pkg.price_cents)}
                    {pkg.card_link ? <span className="text-sm font-medium text-graphite/50"> no PIX</span> : null}
                  </p>
                  {pkg.card_link ? (
                    <p className="text-xs text-graphite/55">
                      ou {formatCurrency(pickOption(packagePaymentOptions(pkg, cardSettings), "card").cents)} no cartão
                    </p>
                  ) : null}
                  <p className="text-xs text-graphite/50">
                    {pkg.sessions} consultas · {formatCurrency(perSessionCents(pkg))} cada
                    {savings.savingsCents ? ` · você economiza ${formatCurrency(savings.savingsCents)}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => startBuy(pkg)}
                    disabled={Boolean(pending) || busyId === pkg.id}
                    className={`${btnPrimary()} mt-4 self-start`}
                  >
                    {busyId === pkg.id ? "Contratando…" : "Contratar"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
      <Modal open={Boolean(buying)} onClose={() => setBuying(null)} title={buying ? `Contratar “${buying.name}”` : ""} size="sm">
        {buying ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-graphite/70">
              {buying.sessions} consultas. Depois de contratar, é só pagar e enviar o comprovante para a Letícia.
            </p>
            {buyOptions.length > 1 ? (
              <PaymentMethodChoice options={buyOptions} value={buyMethod} onChange={setBuyMethod} />
            ) : (
              <p className="text-lg font-semibold text-graphite">{formatCurrency(buying.price_cents)} no PIX</p>
            )}
            <div className="flex flex-col-reverse gap-2 border-t border-olive-900/10 pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setBuying(null)} className={btnSecondary()}>
                Voltar
              </button>
              <button type="button" onClick={buy} className={btnPrimary()}>
                Contratar por {formatCurrency(buyChosen?.cents ?? buying.price_cents)}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </Card>
  );
}
