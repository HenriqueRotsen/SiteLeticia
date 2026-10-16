"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary, btnSecondary, inputClassName } from "@/components/layout/AppShell";
import Modal from "@/components/ui/Modal";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDateInput(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function appointmentLabel(appt) {
  if (!appt) return "—";
  const when = formatDateTime(appt.starts_at);
  const type = appt.type === "return" ? "Retorno" : "Consulta";
  return `${when} · ${type}`;
}

function recordBody(record) {
  return record?.body_text ?? record?.body_md ?? "";
}

function emptyDraft() {
  return {
    id: null,
    title: "",
    body_text: "",
    session_at: formatDateInput(new Date()),
    appointment_id: ""
  };
}

export default function AdminProntuarioPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const patientId = params.id;

  const [patientName, setPatientName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [mode, setMode] = useState("view");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successModal, setSuccessModal] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const pastAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at))
      .slice(0, 40);
  }, [appointments]);

  const selected = useMemo(
    () => records.find((item) => item.id === selectedId) || null,
    [records, selectedId]
  );

  async function load(preferId = null) {
    const [patientData, appointmentsData, recordsData] = await Promise.all([
      fetch(`/api/admin/patients/${patientId}`).then((r) => r.json()),
      fetch(`/api/admin/appointments?patientId=${patientId}`).then((r) => r.json()),
      fetch(`/api/patients/${patientId}/prontuario`).then((r) => r.json())
    ]);
    const name = patientData.patient?.full_name || "";
    const nextRecords = recordsData.records || [];
    setPatientName(name);
    setAppointments(appointmentsData.appointments || []);
    setRecords(nextRecords);
    if (recordsData.message && !nextRecords.length) {
      setError(recordsData.message);
    }

    const nextSelected =
      (preferId && nextRecords.find((item) => item.id === preferId)?.id) ||
      nextRecords[0]?.id ||
      null;
    setSelectedId(nextSelected);
    setDraft(null);
    setMode(nextSelected ? "view" : "edit");
    if (!nextSelected) setDraft(emptyDraft());
  }

  useEffect(() => {
    load().catch(() => setError("Não foi possível carregar o prontuário."));
  }, [patientId]);

  function startCreate() {
    const draftNew = emptyDraft();
    const fromQuery = searchParams.get("appointmentId");
    if (fromQuery) draftNew.appointment_id = fromQuery;
    setSelectedId(null);
    setDraft(draftNew);
    setMode("edit");
    setError("");
  }

  function startEdit(record = selected) {
    if (!record) return;
    setDraft({
      id: record.id,
      title: record.title || "",
      body_text: recordBody(record),
      session_at: formatDateInput(record.session_at),
      appointment_id: record.appointment_id || ""
    });
    setMode("edit");
    setError("");
  }

  function openRecord(recordId) {
    setSelectedId(recordId);
    setDraft(null);
    setMode("view");
    setError("");
  }

  async function saveDraft() {
    if (!draft) return;
    if (!String(draft.body_text || "").trim()) {
      setError("Cole o texto do prontuário.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      title: draft.title.trim() || null,
      bodyText: draft.body_text,
      sessionAt: draft.session_at ? new Date(draft.session_at).toISOString() : new Date().toISOString(),
      appointmentId: draft.appointment_id || null
    };

    let res;
    if (draft.id) {
      res = await fetch(`/api/patients/${patientId}/prontuario`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: draft.id, ...payload })
      });
    } else {
      res = await fetch(`/api/patients/${patientId}/prontuario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.message || "Erro ao salvar prontuário.");
      return;
    }

    const savedId = data.record?.id || draft.id;
    await load(savedId);
    setSuccessModal({
      title: draft.id ? "Prontuário atualizado" : "Prontuário salvo",
      message: "O registro da sessão foi gravado no histórico do paciente."
    });
  }

  async function deleteRecord(recordId) {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/patients/${patientId}/prontuario/${recordId}`, {
      method: "DELETE"
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setConfirmDeleteId(null);

    if (!res.ok) {
      setError(data.message || "Erro ao excluir.");
      return;
    }

    await load();
    setSuccessModal({
      title: "Registro excluído",
      message: "O prontuário foi removido do histórico."
    });
  }

  const viewingTitle =
    mode === "edit"
      ? draft?.title || "Nova sessão"
      : selected?.title || "Registro de sessão";

  return (
    <AdminShell
      title="Prontuário"
      subtitle="Cole o texto gerado a partir da transcrição da sessão"
      breadcrumbs={[
        "Admin",
        "Pacientes",
        { label: patientName || "...", href: `/admin/pacientes/${patientId}` },
        "Prontuário"
      ]}
      userName="Letícia"
    >
      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="overflow-hidden p-0 sm:p-0 lg:sticky lg:top-5">
          <div className="flex items-center justify-between border-b border-olive-900/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-graphite">Sessões</p>
              <p className="text-xs text-graphite/45">
                {records.length} {records.length === 1 ? "registro" : "registros"}
              </p>
            </div>
            <button type="button" className={btnPrimary()} onClick={startCreate}>
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Nova
            </button>
          </div>
          <div className="max-h-[min(70dvh,640px)] space-y-2 overflow-y-auto p-3">
            {records.map((record) => {
              const active = selectedId === record.id && mode !== "edit";
              const editingThis = draft?.id === record.id && mode === "edit";
              return (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => openRecord(record.id)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                    active || editingThis
                      ? "border-olive-400 bg-olive-50"
                      : "border-olive-900/8 bg-white hover:border-olive-300"
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-graphite">
                    {record.title || "Registro de sessão"}
                  </p>
                  <p className="mt-0.5 text-xs text-graphite/45">
                    {formatDateTime(record.session_at)}
                  </p>
                </button>
              );
            })}
            {!records.length ? (
              <p className="px-1 py-6 text-center text-sm text-graphite/45">
                Nenhum prontuário ainda. Cole o primeiro após a sessão.
              </p>
            ) : null}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-graphite">{viewingTitle}</h2>
                <p className="mt-1 text-xs text-graphite/45">
                  {mode === "edit"
                    ? "Colando / editando texto"
                    : selected
                      ? formatDateTime(selected.session_at)
                      : "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {mode === "view" && selected ? (
                  <>
                    <button type="button" className={btnSecondary()} onClick={() => startEdit(selected)}>
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
                      onClick={() => setConfirmDeleteId(selected.id)}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      Excluir
                    </button>
                  </>
                ) : null}
                {mode === "edit" ? (
                  <>
                    <button
                      type="button"
                      className={btnSecondary()}
                      onClick={() => {
                        if (draft?.id) openRecord(draft.id);
                        else if (records[0]) openRecord(records[0].id);
                        else {
                          setMode("view");
                          setDraft(null);
                        }
                      }}
                    >
                      <Eye className="h-4 w-4" strokeWidth={1.75} />
                      Ver
                    </button>
                    <button
                      type="button"
                      className={btnPrimary()}
                      disabled={saving}
                      onClick={saveDraft}
                    >
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                  </>
                ) : null}
                <Link href={`/admin/pacientes/${patientId}`} className={btnSecondary()}>
                  Voltar
                </Link>
              </div>
            </div>
          </Card>

          {mode === "edit" && draft ? (
            <Card title="Colar prontuário">
              <div className="space-y-4">
                <p className="text-sm text-graphite/60">
                  Após a sessão, envie a transcrição ao ChatGPT e cole aqui o texto do prontuário.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-graphite/55">
                    Data da sessão
                    <input
                      type="datetime-local"
                      className={`mt-1 ${inputClassName()}`}
                      value={draft.session_at}
                      onChange={(e) => setDraft({ ...draft, session_at: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs font-medium text-graphite/55">
                    Vincular consulta (opcional)
                    <select
                      className={`mt-1 ${inputClassName()}`}
                      value={draft.appointment_id}
                      onChange={(e) => setDraft({ ...draft, appointment_id: e.target.value })}
                    >
                      <option value="">Sem vínculo</option>
                      {pastAppointments.map((appt) => (
                        <option key={appt.id} value={appt.id}>
                          {appointmentLabel(appt)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block text-xs font-medium text-graphite/55">
                  Título
                  <input
                    className={`mt-1 ${inputClassName()}`}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Ex.: Retorno · 16/10"
                  />
                </label>

                <label className="block text-xs font-medium text-graphite/55">
                  Texto do prontuário
                  <textarea
                    className={`mt-1 min-h-[480px] text-sm leading-relaxed ${inputClassName()}`}
                    value={draft.body_text}
                    onChange={(e) => setDraft({ ...draft, body_text: e.target.value })}
                    placeholder="Cole aqui o prontuário gerado pelo ChatGPT…"
                    spellCheck
                    autoFocus
                  />
                </label>
              </div>
            </Card>
          ) : selected ? (
            <Card title="Prontuário">
              <div className="whitespace-pre-wrap rounded-2xl border border-olive-900/8 bg-white px-4 py-4 text-sm leading-relaxed text-graphite/80 sm:px-5">
                {recordBody(selected) || "—"}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center py-12 text-center">
                <FileText className="h-8 w-8 text-graphite/20" strokeWidth={1.5} />
                <p className="mt-3 text-sm text-graphite/50">
                  Selecione uma sessão ou cole um novo prontuário.
                </p>
                <button type="button" className={`${btnPrimary()} mt-4`} onClick={startCreate}>
                  <Plus className="h-4 w-4" strokeWidth={1.75} />
                  Nova sessão
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(confirmDeleteId)}
        onClose={() => !saving && setConfirmDeleteId(null)}
        title="Excluir prontuário"
        size="sm"
      >
        <p className="text-sm text-graphite/65">
          Remover este registro do histórico? O texto será excluído permanentemente.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={btnSecondary()}
            disabled={saving}
            onClick={() => setConfirmDeleteId(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            disabled={saving}
            onClick={() => deleteRecord(confirmDeleteId)}
          >
            {saving ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(successModal)} onClose={() => setSuccessModal(null)} size="sm">
        <div className="flex flex-col items-center px-2 pb-2 pt-1 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-olive-100 text-olive-700">
            <CheckCircle2 className="h-9 w-9" strokeWidth={1.75} />
          </span>
          <h3 className="mt-4 text-xl font-semibold text-graphite">
            {successModal?.title || "Sucesso"}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-graphite/60">
            {successModal?.message || "Operação concluída."}
          </p>
          <button
            type="button"
            className={`${btnPrimary()} mt-6 w-full sm:w-auto`}
            onClick={() => setSuccessModal(null)}
          >
            Ok
          </button>
        </div>
      </Modal>
    </AdminShell>
  );
}
