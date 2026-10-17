"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Pill, Plus, Stethoscope, Trash2 } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary, btnSecondary, inputClassName } from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import PresetEditor from "@/components/ui/PresetEditor";

const TYPE_META = {
  supplement_pack: {
    label: "Suplementação",
    icon: Pill,
    tone: "bg-violet-100 text-violet-700"
  },
  exam_order: {
    label: "Exames",
    icon: ClipboardList,
    tone: "bg-amber-100 text-amber-800"
  },
  referral_letter: {
    label: "Encaminhamentos",
    icon: Stethoscope,
    tone: "bg-sky-100 text-sky-700"
  }
};

function emptyContent(type) {
  if (type === "supplement_pack") return { items: [], packPosology: "", notes: "" };
  if (type === "exam_order") return { exams: [], collectionNotes: [], observations: "" };
  return {
    specialty: "",
    reason: "Solicitação de parecer médico",
    urgency: "routine",
    bodyText: "",
    notes: ""
  };
}

export default function AdminPresetsPage() {
  const [presets, setPresets] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState("supplement_pack");
  const [createTitle, setCreateTitle] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [successModal, setSuccessModal] = useState(null);

  async function load(resync = false) {
    const res = await fetch(`/api/admin/presets?active=all${resync ? "&resync=1" : ""}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok && !(data.presets || []).length) {
      setError(data.message || "Erro ao carregar presets.");
      return;
    }
    setPresets(data.presets || []);
    setError("");
    if (resync) {
      setSuccessModal({
        title: "Modelos restaurados",
        message: "Os modelos padrão foram recarregados com sucesso."
      });
      setEditing(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return presets;
    return presets.filter((item) => item.type === filter);
  }, [presets, filter]);

  function startEdit(preset) {
    setEditing({
      ...preset,
      content: preset.content ? structuredClone(preset.content) : emptyContent(preset.type)
    });
    setError("");
  }

  function updateContent(content) {
    setEditing((current) => (current ? { ...current, content } : current));
  }

  function openCreateModal() {
    const defaultType =
      filter !== "all" && TYPE_META[filter] ? filter : "supplement_pack";
    setCreateType(defaultType);
    setCreateTitle("");
    setCreateOpen(true);
    setError("");
  }

  async function createPreset() {
    const title = createTitle.trim();
    if (!title) {
      setError("Informe um título para o novo modelo.");
      return;
    }

    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: createType,
        title,
        content: emptyContent(createType),
        active: true,
        sortOrder: 0
      })
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.message || "Erro ao criar preset.");
      return;
    }

    setCreateOpen(false);
    await load();
    if (data.preset) startEdit(data.preset);
    setSuccessModal({
      title: "Preset criado",
      message: `O modelo “${title}” foi criado e já está disponível para edição.`
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/admin/presets/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editing.title,
        active: editing.active,
        content: editing.content
      })
    });
    const data = await res.json().catch(() => ({}));

    // Seed embutido (sem linha no banco): cria/atualiza via POST upsert
    if (!res.ok && String(editing.id || "").startsWith("seed-")) {
      const createRes = await fetch("/api/admin/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editing.type,
          title: editing.title,
          slug: editing.slug,
          content: editing.content,
          active: editing.active !== false,
          sortOrder: editing.sortOrder ?? 0
        })
      });
      const createData = await createRes.json().catch(() => ({}));
      setSaving(false);
      if (!createRes.ok) {
        setError(createData.message || data.message || "Erro ao salvar preset.");
        return;
      }
      setEditing(createData.preset || editing);
      await load();
      setSuccessModal({
        title: "Alterações salvas",
        message: "O preset foi atualizado com sucesso."
      });
      return;
    }

    setSaving(false);
    if (!res.ok) {
      setError(data.message || "Erro ao salvar preset.");
      return;
    }

    setEditing(data.preset || editing);
    await load();
    setSuccessModal({
      title: "Alterações salvas",
      message: "O preset foi atualizado com sucesso."
    });
  }

  async function toggleActive() {
    if (!editing) return;
    const nextActive = !editing.active;
    setEditing({ ...editing, active: nextActive });

    const res = await fetch(`/api/admin/presets/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: nextActive })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message || "Erro ao atualizar status.");
      setEditing({ ...editing, active: !nextActive });
      return;
    }
    await load();
    setSuccessModal({
      title: nextActive ? "Preset ativado" : "Preset desativado",
      message: nextActive
        ? "O modelo voltou a aparecer na prescrição."
        : "O modelo foi desativado e não aparece mais na prescrição."
    });
  }

  async function deletePreset() {
    if (!editing) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/admin/presets/${editing.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.message || "Erro ao excluir preset.");
      setConfirmDeleteOpen(false);
      return;
    }

    const title = editing.title;
    setConfirmDeleteOpen(false);
    setEditing(null);
    await load();
    setSuccessModal({
      title: "Preset excluído",
      message: `O modelo “${title}” foi removido com sucesso.`
    });
  }

  return (
    <AdminShell
      title="Presets de prescrição"
      subtitle="Edite pacotes e templates em formulário"
      breadcrumbs={["Admin", "Configurações", "Presets"]}
      userName="Letícia"
    >
      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "Todos" },
            { id: "supplement_pack", label: "Suplementação" },
            { id: "exam_order", label: "Exames" },
            { id: "referral_letter", label: "Encaminhamentos" }
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={
                filter === option.id
                  ? "rounded-full bg-olive-800 px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full border border-olive-900/10 bg-white px-3 py-1.5 text-xs font-medium text-graphite/60"
              }
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary()} onClick={openCreateModal}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Novo modelo
          </button>
          <button type="button" className={btnSecondary()} onClick={() => load(true)}>
            Restaurar modelos
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <Card className="flex min-h-0 flex-col overflow-hidden lg:sticky lg:top-[calc(var(--demo-banner-height,0px)+5.5rem)] lg:max-h-[calc(100dvh-var(--demo-banner-height,0px)-6.5rem)]">
          <div className="max-h-[calc(100dvh-15rem)] min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 lg:max-h-none">
            {filtered.map((preset) => {
              const meta = TYPE_META[preset.type] || TYPE_META.supplement_pack;
              const Icon = meta.icon;
              const doseHint =
                preset.type === "supplement_pack"
                  ? `${(preset.content?.items || []).length} itens`
                  : preset.type === "exam_order"
                    ? `${(preset.content?.exams || []).length} exames`
                    : "parecer";

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => startEdit(preset)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                    editing?.id === preset.id
                      ? "border-olive-400 bg-olive-50"
                      : "border-olive-900/8 bg-white hover:border-olive-300"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{preset.title}</p>
                    <p className="text-xs text-graphite/45">
                      {meta.label} · {doseHint}
                    </p>
                  </div>
                  <Badge variant={preset.active !== false ? "success" : "neutral"}>
                    {preset.active !== false ? "Ativo" : "Inativo"}
                  </Badge>
                </button>
              );
            })}
            {!filtered.length ? (
              <p className="text-sm text-graphite/50">Nenhum preset neste filtro.</p>
            ) : null}
          </div>
        </Card>

        <Card title={editing ? "Editar modelo" : "Selecione um modelo"}>
          {editing ? (
            <div className="space-y-4">
              <label className="block text-xs font-medium text-graphite/55">
                Título do pacote
                <input
                  className={`mt-1 ${inputClassName()}`}
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </label>

              <PresetEditor
                type={editing.type}
                content={editing.content || emptyContent(editing.type)}
                onChange={updateContent}
              />

              <div className="flex flex-wrap gap-2 border-t border-olive-900/8 pt-4">
                <button type="button" className={btnPrimary()} disabled={saving} onClick={saveEdit}>
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
                <button type="button" className={btnSecondary()} onClick={toggleActive}>
                  {editing.active !== false ? "Desativar" : "Ativar"}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-60"
                  disabled={saving}
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  Excluir
                </button>
                <button type="button" className={btnSecondary()} onClick={() => setEditing(null)}>
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-graphite/55">
              Escolha um modelo à esquerda para editar, ou clique em{" "}
              <span className="font-medium text-graphite">Novo modelo</span> para criar um preset.
            </p>
          )}
        </Card>
      </div>

      <Modal
        open={createOpen}
        onClose={() => !saving && setCreateOpen(false)}
        title="Novo modelo"
        size="sm"
      >
        <div className="space-y-4">
          <label className="block text-xs font-medium text-graphite/55">
            Tipo
            <select
              className={`mt-1 ${inputClassName()}`}
              value={createType}
              onChange={(e) => setCreateType(e.target.value)}
            >
              <option value="supplement_pack">Suplementação</option>
              <option value="exam_order">Exames</option>
              <option value="referral_letter">Encaminhamentos</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-graphite/55">
            Título
            <input
              className={`mt-1 ${inputClassName()}`}
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Ex.: Combo recuperacional"
              autoFocus
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              className={btnSecondary()}
              disabled={saving}
              onClick={() => setCreateOpen(false)}
            >
              Cancelar
            </button>
            <button type="button" className={btnPrimary()} disabled={saving} onClick={createPreset}>
              {saving ? "Criando..." : "Criar"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmDeleteOpen}
        onClose={() => !saving && setConfirmDeleteOpen(false)}
        title="Excluir preset"
        size="sm"
      >
        <p className="text-sm text-graphite/65">
          Excluir permanentemente o modelo{" "}
          <span className="font-medium text-graphite">“{editing?.title || "—"}”</span>? Esta ação
          não pode ser desfeita.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={btnSecondary()}
            disabled={saving}
            onClick={() => setConfirmDeleteOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            disabled={saving}
            onClick={deletePreset}
          >
            {saving ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(successModal)}
        onClose={() => setSuccessModal(null)}
        size="sm"
      >
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
