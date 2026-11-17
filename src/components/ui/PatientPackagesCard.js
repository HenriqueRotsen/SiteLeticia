"use client";

// Pacotes do paciente (visão da nutricionista): confirmar pagamento, cancelar ou lançar um pacote.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { Card, btnPrimary, btnSecondary, formatCurrency } from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useDialog } from "@/components/ui/ConfirmDialog";
import { packageStatusLabel, remainingSessions } from "@/lib/packages/pricing";

export default function PatientPackagesCard({ patientId, version = 0 }) {
  const { confirm } = useDialog();
  const [packages, setPackages] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [notice, setNotice] = useState("");
  const [granting, setGranting] = useState(false);
  const [grantId, setGrantId] = useState("");
  const [grantPaid, setGrantPaid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/patients/${patientId}/packages`);
    const data = await res.json().catch(() => ({}));
    setPackages(data.packages || []);
    setCatalog(data.catalog || []);
    setNotice(data.needsMigration ? data.message : "");
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load, version]);

  async function setStatus(pkg, paymentStatus) {
    if (paymentStatus === "cancelled") {
      const ok = await confirm({
        title: "Cancelar este pacote?",
        message: "As consultas que sobraram deixam de ficar disponíveis para o paciente.",
        confirmLabel: "Cancelar pacote",
        cancelLabel: "Manter",
        tone: "danger"
      });
      if (!ok) return;
    }
    setError("");
    const res = await fetch(`/api/admin/patient-packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.message || "Não foi possível atualizar.");
    load();
  }

  async function grant(event) {
    event.preventDefault();
    if (!grantId) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/patients/${patientId}/packages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: grantId, paid: grantPaid })
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.message || "Não foi possível adicionar.");
      return;
    }
    setGranting(false);
    setGrantId("");
    load();
  }

  return (
    <Card className="mt-5 overflow-hidden p-0 sm:p-0">
      <div className="flex items-center justify-between gap-3 border-b border-olive-900/10 bg-gradient-to-r from-amber-50/80 to-porcelain px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Package className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="font-semibold text-graphite">Pacotes</h2>
            <p className="text-xs text-graphite/45">Consultas compradas em combo</p>
          </div>
        </div>
        {catalog.length ? (
          <button
            type="button"
            onClick={() => setGranting(true)}
            className="text-xs font-semibold text-olive-700 hover:text-olive-800"
          >
            Adicionar →
          </button>
        ) : null}
      </div>

      <div className="p-5">
        {notice ? <p className="text-sm text-amber-800">{notice}</p> : null}
        {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
        {!packages.length ? (
          <p className="text-sm text-graphite/50">
            Nenhum pacote contratado.
            {!catalog.length && !notice ? (
              <>
                {" "}
                <Link href="/admin/configuracoes/pacotes" className="font-semibold text-olive-800 hover:underline">
                  Criar pacotes
                </Link>
              </>
            ) : null}
          </p>
        ) : (
          <ul className="space-y-2.5">
            {packages.map((pkg) => {
              const status = packageStatusLabel(pkg);
              const left = remainingSessions(pkg);
              return (
                <li key={pkg.id} className="rounded-2xl border border-olive-900/8 bg-white px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-graphite">{pkg.name}</p>
                      <p className="mt-0.5 text-xs text-graphite/50">
                        {formatCurrency(pkg.price_cents)} · {pkg.sessions_used} de {pkg.sessions_total} consultas usadas
                        {pkg.payment_status === "paid" ? ` · ${left} restantes` : ""}
                      </p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  {pkg.payment_status === "pending" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setStatus(pkg, "paid")} className={btnPrimary()}>
                        Confirmar pagamento
                      </button>
                      <button type="button" onClick={() => setStatus(pkg, "cancelled")} className={btnSecondary()}>
                        Cancelar
                      </button>
                    </div>
                  ) : pkg.payment_status === "paid" && left > 0 ? (
                    <button
                      type="button"
                      onClick={() => setStatus(pkg, "cancelled")}
                      className="mt-2 text-xs font-semibold text-rose-700 hover:underline"
                    >
                      Cancelar pacote
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal open={granting} onClose={() => setGranting(false)} title="Adicionar pacote" size="sm">
        <form onSubmit={grant} className="space-y-4">
          <label className="block text-sm font-medium text-graphite">
            Pacote
            <select
              className="mt-1 w-full rounded-xl border border-olive-900/15 bg-white px-3 py-2.5 text-sm"
              value={grantId}
              onChange={(e) => setGrantId(e.target.value)}
              required
            >
              <option value="">Escolha…</option>
              {catalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.sessions} consultas · {formatCurrency(item.price_cents)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-graphite">
            <input type="checkbox" checked={grantPaid} onChange={(e) => setGrantPaid(e.target.checked)} />
            Pagamento já recebido
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setGranting(false)} className={btnSecondary()}>
              Cancelar
            </button>
            <button type="submit" disabled={!grantId || busy} className={btnPrimary()}>
              {busy ? "Adicionando…" : "Adicionar"}
            </button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
