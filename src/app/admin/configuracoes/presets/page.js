"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ClipboardList, Layers, Pill, Plus, Stethoscope, ToggleLeft, Trash2 } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary, btnSecondary, inputClassName } from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import PresetEditor from "@/components/ui/PresetEditor";
import SmartTable from "@/components/ui/SmartTable";
import { useDialog } from "@/components/ui/ConfirmDialog";
import {
  countPresetSupplements,
  presetSearchText,
  presetSupplementEntries,
  supplementPresetContent
} from "@/lib/presets/supplements";

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
  if (type === "supplement_pack") return { entries: [], notes: "" };
  if (type === "exam_order") return { exams: [], collectionNotes: [], observations: "" };
  return {
    specialty: "",
    reason: "Solicitação de parecer médico",
    urgency: "routine",
    bodyText: "",
    notes: ""
  };
}

// Resumo do conteúdo para a lista ("2 combos · 7 produtos", "12 exames"…).
function contentSummary(preset) {
  if (preset.type === "supplement_pack") {
    const { combos, products } = countPresetSupplements(preset.content);
    const productText = `${products} ${products === 1 ? "produto" : "produtos"}`;
    return combos ? `${combos} ${combos === 1 ? "combo" : "combos"} · ${productText}` : productText;
  }
  if (preset.type === "exam_order") {
    const count = (preset.content?.exams || []).length;
    return `${count} ${count === 1 ? "exame" : "exames"}`;
  }
  return preset.content?.specialty || "Parecer";
}

// O editor trabalha sempre no formato novo (combos + avulsos); presets antigos são convertidos ao abrir.
function editableContent(preset) {
  if (!preset.content) return emptyContent(preset.type);
  if (preset.type === "supplement_pack") {
    return { entries: presetSupplementEntries(preset.content, preset.title), notes: preset.content.notes || "" };
  }
  return structuredClone(preset.content);
}

function contentForSave(editing) {
  if (editing.type === "supplement_pack") {
    return supplementPresetContent(editing.content?.entries || [], editing.content?.notes || "");
  }
  return editing.content;
}

const FILTERS = [
  {
    key: "type",
    label: "Tipo",
    icon: Layers,
    options: [
      { value: "all", label: "Todos" },
      ...Object.entries(TYPE_META).map(([value, meta]) => ({ value, label: meta.label }))
    ],
    predicate: (row, value) => row.type === value
  },
  {
    key: "status",
    label: "Situação",
    icon: ToggleLeft,
    options: [
      { value: "all", label: "Ativos e inativos" },
      { value: "active", label: "Ativos" },
      { value: "inactive", label: "Inativos" }
    ],
    predicate: (row, value) => (value === "active" ? row.active !== false : row.active === false)
  }
];

export default function AdminPresetsPage() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const originalRef = useRef("");
  const { confirm } = useDialog();
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
    setLoading(false);
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

  function startEdit(preset) {
    const next = { ...preset, content: editableContent(preset) };
    originalRef.current = JSON.stringify({ title: next.title, content: contentForSave(next) });
    setEditing(next);
    setError("");
  }

  async function closeEditor() {
    if (!editing) return;
    const current = JSON.stringify({ title: editing.title, content: contentForSave(editing) });
    if (current !== originalRef.current) {
      const ok = await confirm({
        title: "Descartar alterações?",
        message: "Você mudou este preset e ainda não salvou.",
        confirmLabel: "Descartar",
        cancelLabel: "Continuar editando",
        tone: "danger"
      });
      if (!ok) return;
    }
    setEditing(null);
  }

  function updateContent(content) {
    setEditing((current) => (current ? { ...current, content } : current));
  }

  function openCreateModal() {
    setCreateType("supplement_pack");
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
        content: contentForSave(editing)
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
          content: contentForSave(editing),
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
      if (createData.preset) startEdit(createData.preset);
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

    if (data.preset) startEdit(data.preset);
    else originalRef.current = JSON.stringify({ title: editing.title, content: contentForSave(editing) });
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
      subtitle="Modelos de suplementação, exames e encaminhamentos"
      breadcrumbs={["Admin", "Configurações", "Presets"]}
      userName="Letícia"
    >
      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button type="button" className={btnPrimary()} onClick={openCreateModal}>
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Novo modelo
        </button>
        <button type="button" className={btnSecondary()} onClick={() => load(true)}>
          Restaurar modelos
        </button>
      </div>

      <Card>
        <SmartTable
          rows={presets}
          loading={loading}
          itemLabel={["modelo", "modelos"]}
          searchPlaceholder="Buscar suplemento, exame, encaminhamento…"
          searchFields={(row) => [presetSearchText(row), TYPE_META[row.type]?.label]}
          filters={FILTERS}
          defaultSort={{ key: "title", dir: "asc" }}
          pageSize={25}
          emptyMessage="Nenhum modelo cadastrado."
          noResultsMessage="Nenhum modelo com essa busca."
          onRowDoubleClick={startEdit}
          columns={[
            {
              key: "title",
              label: "Modelo",
              mobile: "title",
              sortValue: (row) => row.title,
              sortLabels: ["A–Z", "Z–A"],
              render: (row) => {
                const meta = TYPE_META[row.type] || TYPE_META.supplement_pack;
                const Icon = meta.icon;
                return (
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="flex items-center gap-3 text-left"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="font-semibold text-graphite underline-offset-2 hover:text-olive-800 hover:underline">
                      {row.title}
                    </span>
                  </button>
                );
              }
            },
            {
              key: "type",
              label: "Tipo",
              mobile: "subtitle",
              sortValue: (row) => TYPE_META[row.type]?.label,
              sortLabels: ["A–Z", "Z–A"],
              render: (row) => TYPE_META[row.type]?.label || "—"
            },
            { key: "summary", label: "Conteúdo", render: contentSummary },
            {
              key: "status",
              label: "Situação",
              mobile: "badges",
              render: (row) => (
                <Badge variant={row.active !== false ? "success" : "neutral"}>
                  {row.active !== false ? "Ativo" : "Inativo"}
                </Badge>
              )
            },
            {
              key: "actions",
              label: "",
              mobile: "actions",
              render: (row) => (
                <button type="button" onClick={() => startEdit(row)} className="font-semibold text-olive-800 hover:underline">
                  Abrir
                </button>
              )
            }
          ]}
        />
      </Card>

      <Modal open={Boolean(editing)} onClose={closeEditor} title={editing?.title || "Modelo"} size="xl">
        {editing ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-graphite/55">
              <span>{TYPE_META[editing.type]?.label}</span>
              <Badge variant={editing.active !== false ? "success" : "neutral"}>
                {editing.active !== false ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <label className="block text-xs font-medium text-graphite/55">
              Título do modelo
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

            <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap gap-2 border-t border-olive-900/10 bg-porcelain/95 px-5 py-4 backdrop-blur-xs sm:-mx-6 sm:-mb-6 sm:px-6">
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
              <button type="button" className={`${btnSecondary()} sm:ml-auto`} onClick={closeEditor}>
                Fechar
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

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
