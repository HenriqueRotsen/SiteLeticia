"use client";

// Fila de espera: a Letícia avisa as próximas pessoas, sempre na ordem da fila,
// com a mensagem pronta no WhatsApp. Avisar não bloqueia nem obriga ninguém a marcar.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, Check, ListOrdered, MessageCircle, RotateCcw, Send, Target, Users } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary, btnSecondary } from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import SmartTable from "@/components/ui/SmartTable";
import StatCard from "@/components/ui/StatCard";
import { useDialog } from "@/components/ui/ConfirmDialog";
import { GOALS } from "@/lib/constants";
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_NOTIFY_TEMPLATE,
  MAX_BATCH_SIZE,
  TEMPLATE_PLACEHOLDERS,
  clampBatchSize,
  nextInLine,
  renderNotifyMessage,
  waitlistWhatsappLink
} from "@/lib/waitlist/notify";

const TEMPLATE_KEY = "lc-waitlist-notify-template";

function formatPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return phone || "—";
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "—";
}

function readTemplate() {
  try {
    return window.localStorage.getItem(TEMPLATE_KEY) || DEFAULT_NOTIFY_TEMPLATE;
  } catch {
    return DEFAULT_NOTIFY_TEMPLATE;
  }
}

function saveTemplate(value) {
  try {
    if (value === DEFAULT_NOTIFY_TEMPLATE) window.localStorage.removeItem(TEMPLATE_KEY);
    else window.localStorage.setItem(TEMPLATE_KEY, value);
  } catch {
    // Sem armazenamento local: a mensagem editada vale só nesta visita.
  }
}

const FILTERS = [
  {
    key: "status",
    label: "Situação",
    icon: ListOrdered,
    options: [
      { value: "all", label: "Todos" },
      { value: "waiting", label: "Aguardando aviso" },
      { value: "called", label: "Já avisados" }
    ],
    predicate: (row, value) => row.status === value
  },
  {
    key: "goal",
    label: "Objetivo",
    icon: Target,
    options: [{ value: "all", label: "Todos" }, ...GOALS.map((goal) => ({ value: goal, label: goal }))],
    predicate: (row, value) => row.goal === value
  }
];

function NotifyBatchModal({ open, batch, signupLink, onClose, onNotified }) {
  const { confirm, alert } = useDialog();
  const [template, setTemplate] = useState(DEFAULT_NOTIFY_TEMPLATE);
  const [editing, setEditing] = useState(false);
  const [sent, setSent] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTemplate(readTemplate());
    setSent({});
    setEditing(false);
  }, [open]);

  async function markNotified(ids) {
    const res = await fetch("/api/admin/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, batchSize: batch.length })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      await alert({ title: "Não foi possível registrar o aviso", message: data.message || "Tente de novo." });
      return false;
    }
    setSent((current) => ({ ...current, ...Object.fromEntries(ids.map((id) => [id, true])) }));
    onNotified?.();
    return true;
  }

  async function markAll() {
    const pending = batch.filter((entry) => !sent[entry.id]).map((entry) => entry.id);
    if (!pending.length) return;
    const ok = await confirm({
      title: `Marcar ${pending.length} como avisada${pending.length === 1 ? "" : "s"}?`,
      message: "Use quando você já mandou a mensagem por outro caminho. Elas saem da fila de aviso.",
      confirmLabel: "Marcar como avisadas"
    });
    if (!ok) return;
    setSaving(true);
    await markNotified(pending);
    setSaving(false);
  }

  const sentCount = batch.filter((entry) => sent[entry.id]).length;

  return (
    <Modal open={open} onClose={onClose} title={`Avisar os próximos ${batch.length} da fila`} size="lg">
      <div className="space-y-4">
        <p className="text-sm leading-6 text-graphite/65">
          Toque em <strong>Enviar no WhatsApp</strong> em cada pessoa: a conversa abre com a mensagem pronta e ela fica
          marcada como avisada. A ordem é a da fila.
        </p>

        <div className="rounded-2xl border border-olive-900/10 bg-linen/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-graphite/50">Mensagem</p>
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              className="text-xs font-semibold text-olive-800 hover:underline"
            >
              {editing ? "Pronto" : "Editar mensagem"}
            </button>
          </div>
          {editing ? (
            <>
              <textarea
                value={template}
                onChange={(event) => {
                  setTemplate(event.target.value);
                  saveTemplate(event.target.value);
                }}
                rows={7}
                className="mt-2 w-full rounded-xl border border-olive-900/10 bg-white px-3 py-2.5 text-sm leading-6 text-graphite outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-100"
              />
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-graphite/50">
                <span>Campos: {TEMPLATE_PLACEHOLDERS.join(" ")}</span>
                <button
                  type="button"
                  onClick={() => {
                    setTemplate(DEFAULT_NOTIFY_TEMPLATE);
                    saveTemplate(DEFAULT_NOTIFY_TEMPLATE);
                  }}
                  className="font-semibold text-olive-800 hover:underline"
                >
                  Restaurar padrão
                </button>
              </div>
            </>
          ) : (
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-graphite/70">
              {renderNotifyMessage(template, { fullName: batch[0]?.full_name, position: batch[0]?.position, link: signupLink })}
            </p>
          )}
        </div>

        <ol className="space-y-2">
          {batch.map((entry) => {
            const message = renderNotifyMessage(template, {
              fullName: entry.full_name,
              position: entry.position,
              link: signupLink
            });
            const href = waitlistWhatsappLink(entry.phone, message);
            const done = Boolean(sent[entry.id]);
            return (
              <li
                key={entry.id}
                className={`flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between ${
                  done ? "border-olive-200 bg-olive-50/60" : "border-olive-900/10 bg-white"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linen text-sm font-semibold text-olive-800">
                    {entry.position}º
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-graphite">{entry.full_name}</p>
                    <p className="text-xs text-graphite/55">
                      {formatPhone(entry.phone)} · {entry.goal}
                    </p>
                  </div>
                </div>
                {done ? (
                  <span className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-olive-800 sm:self-center">
                    <Check className="h-4 w-4" /> Avisada
                  </span>
                ) : href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markNotified([entry.id])}
                    className={btnPrimary("!py-2 text-sm")}
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={1.85} />
                    Enviar no WhatsApp
                  </a>
                ) : (
                  <span className="text-xs text-rose-700">Sem WhatsApp válido</span>
                )}
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col-reverse gap-2 border-t border-olive-900/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-graphite/55">
            {sentCount} de {batch.length} avisada{batch.length === 1 ? "" : "s"}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button type="button" onClick={onClose} className={btnSecondary()}>
              Fechar
            </button>
            {sentCount < batch.length ? (
              <button type="button" onClick={markAll} disabled={saving} className={btnSecondary()}>
                <Check className="h-4 w-4" />
                Marcar todos como avisados
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminFilaPage() {
  const { confirm, alert } = useDialog();
  const [waitlist, setWaitlist] = useState([]);
  const [signupLink, setSignupLink] = useState("");
  const [hasCalledAt, setHasCalledAt] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [batchSize, setBatchSize] = useState(DEFAULT_BATCH_SIZE);
  const [batch, setBatch] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/waitlist");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Não foi possível carregar a fila.");
      setWaitlist(data.waitlist || []);
      setSignupLink(data.signupLink || "");
      setHasCalledAt(data.hasCalledAt !== false);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86_400_000;
    return {
      waiting: waitlist.filter((entry) => entry.status === "waiting").length,
      called: waitlist.filter((entry) => entry.status === "called").length,
      calledWeek: waitlist.filter(
        (entry) => entry.status === "called" && entry.called_at && new Date(entry.called_at).getTime() >= weekAgo
      ).length
    };
  }, [waitlist]);

  function openBatch() {
    const next = nextInLine(waitlist, batchSize);
    if (next.length) setBatch(next);
  }

  async function backToQueue(entry) {
    const ok = await confirm({
      title: "Voltar para a fila?",
      message: `${entry.full_name} volta para a posição original, pela data em que entrou.`,
      confirmLabel: "Voltar para a fila"
    });
    if (!ok) return;
    setBusyId(entry.id);
    const res = await fetch("/api/admin/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, status: "waiting" })
    });
    setBusyId(null);
    if (!res.ok) {
      await alert({ title: "Não foi possível atualizar", message: "Tente de novo em instantes." });
      return;
    }
    load();
  }

  async function remove(entry) {
    const ok = await confirm({
      title: "Remover da fila?",
      message: `${entry.full_name} sai da lista de espera. Se ainda não tiver conta nem dados, também sai de Pacientes.`,
      confirmLabel: "Remover",
      tone: "danger"
    });
    if (!ok) return;
    setBusyId(entry.id);
    const res = await fetch(`/api/admin/waitlist?id=${entry.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      await alert({ title: "Não foi possível remover", message: "Tente de novo em instantes." });
      return;
    }
    load();
  }

  const nextPreview = nextInLine(waitlist, batchSize);

  return (
    <AdminShell
      title="Fila de espera"
      subtitle="Avise as próximas pessoas, sempre na ordem da fila"
      breadcrumbs={["Admin", "Fila de espera"]}
      userName="Letícia"
    >
      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : null}
      {!hasCalledAt ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Para guardar a data de cada aviso, rode <code className="text-xs">supabase/migrate-fila-avisos.sql</code> no
          Supabase. Os avisos já funcionam sem isso.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Aguardando aviso" value={stats.waiting} hint="Na ordem de cadastro" icon={Users} tone="olive" />
        <StatCard label="Já avisados" value={stats.called} hint="Receberam a mensagem" icon={BellRing} tone="sand" />
        <StatCard
          label="Avisados nos últimos 7 dias"
          value={hasCalledAt ? stats.calledWeek : "—"}
          hint="Para acompanhar o ritmo"
          icon={Send}
          tone="sand"
        />
      </div>

      <Card className="mt-6" title="Avisar os próximos">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm leading-6 text-graphite/65">
              O sistema pega sempre as primeiras pessoas da fila. Avisar não obriga a marcar: quem receber decide quando
              agendar.
            </p>
            {nextPreview.length ? (
              <p className="mt-2 text-sm text-graphite/75">
                Próximos:{" "}
                <span className="font-semibold text-graphite">
                  {nextPreview
                    .slice(0, 3)
                    .map((entry) => `${entry.position}º ${entry.full_name.split(/\s+/)[0]}`)
                    .join(", ")}
                  {nextPreview.length > 3 ? ` e mais ${nextPreview.length - 3}` : ""}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-graphite/55">Ninguém aguardando aviso.</p>
            )}
          </div>
          <div className="flex items-end gap-2">
            <label className="text-xs font-medium text-graphite/60">
              Quantas pessoas
              <input
                type="number"
                min={1}
                max={MAX_BATCH_SIZE}
                value={batchSize}
                onChange={(event) => setBatchSize(event.target.value)}
                onBlur={() => setBatchSize(clampBatchSize(batchSize))}
                className="mt-1 block w-24 rounded-xl border border-olive-900/10 bg-white px-3 py-2.5 text-sm text-graphite outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-100"
              />
            </label>
            <button type="button" onClick={openBatch} disabled={!nextPreview.length} className={btnPrimary()}>
              <BellRing className="h-4 w-4" strokeWidth={1.85} />
              Avisar próximos
            </button>
          </div>
        </div>
      </Card>

      <Card className="mt-6" title="Fila completa">
        <SmartTable
          rows={waitlist}
          loading={loading}
          itemLabel={["pessoa", "pessoas"]}
          searchPlaceholder="Nome ou telefone"
          searchFields={(row) => [row.full_name, row.phone, row.goal]}
          filters={FILTERS}
          initialFilters={{ status: "waiting" }}
          defaultSort={{ key: "position", dir: "asc" }}
          emptyMessage="Ninguém na fila de espera."
          noResultsMessage="Ninguém com esses filtros."
          columns={[
            {
              key: "position",
              label: "Posição",
              mobile: "badges",
              sortValue: (row) => row.position ?? row.id + 100000,
              sortLabels: ["1º primeiro", "último primeiro"],
              render: (row) =>
                row.position ? (
                  <Badge variant="warning" className="whitespace-nowrap">
                    {row.position}º
                  </Badge>
                ) : (
                  <Badge variant="success">Avisada</Badge>
                )
            },
            {
              key: "name",
              label: "Nome",
              mobile: "title",
              sortValue: (row) => row.full_name,
              sortLabels: ["A–Z", "Z–A"],
              render: (row) =>
                row.converted_patient_id ? (
                  <Link
                    href={`/admin/pacientes/${row.converted_patient_id}`}
                    className="font-medium text-graphite underline-offset-2 hover:text-olive-800 hover:underline"
                  >
                    {row.full_name}
                  </Link>
                ) : (
                  <span className="font-medium text-graphite">{row.full_name}</span>
                )
            },
            {
              key: "phone",
              label: "WhatsApp",
              nowrap: true,
              render: (row) => {
                const href = waitlistWhatsappLink(row.phone, "");
                return href ? (
                  <a
                    href={href.replace(/\?text=$/, "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-olive-800 underline-offset-2 hover:underline"
                  >
                    {formatPhone(row.phone)}
                  </a>
                ) : (
                  formatPhone(row.phone)
                );
              }
            },
            { key: "goal", label: "Objetivo", sortValue: (row) => row.goal, sortLabels: ["A–Z", "Z–A"] },
            {
              key: "created_at",
              label: "Entrou em",
              nowrap: true,
              sortValue: (row) => new Date(row.created_at).getTime(),
              sortLabels: ["mais antigos", "mais recentes"],
              render: (row) => formatDate(row.created_at)
            },
            {
              key: "called_at",
              label: "Avisada em",
              nowrap: true,
              sortValue: (row) => (row.called_at ? new Date(row.called_at).getTime() : null),
              sortLabels: ["mais antigos", "mais recentes"],
              render: (row) => (row.status === "called" ? formatDate(row.called_at) : "—")
            },
            {
              key: "account",
              label: "Conta",
              render: (row) =>
                row.has_account ? <Badge variant="success">Criada</Badge> : <Badge variant="neutral">Sem conta</Badge>
            },
            {
              key: "actions",
              label: "",
              mobile: "actions",
              render: (row) => (
                <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                  {row.status === "called" ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => backToQueue(row)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-olive-800 hover:underline disabled:opacity-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Voltar para a fila
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => remove(row)}
                    className="text-sm font-semibold text-rose-700 hover:underline disabled:opacity-50"
                  >
                    Remover
                  </button>
                </div>
              )
            }
          ]}
        />
      </Card>

      <NotifyBatchModal
        open={Boolean(batch)}
        batch={batch || []}
        signupLink={signupLink}
        onClose={() => setBatch(null)}
        onNotified={load}
      />
    </AdminShell>
  );
}
