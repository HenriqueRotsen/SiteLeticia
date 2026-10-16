"use client";

import { useEffect, useMemo, useState } from "react";
import { Library, Loader2 } from "lucide-react";
import { btnSecondary } from "@/components/layout/AppShell";
import PresetApplyModal from "@/components/ui/PresetApplyModal";
import SearchableSelect from "@/components/ui/SearchableSelect";

/**
 * Seletor de pacotes/presets editáveis para aplicar na etapa atual.
 * Com `multiple`, permite vários modelos e abre o modal de variáveis.
 */
export default function PresetPicker({
  type,
  label = "Usar pacote",
  onApply,
  disabled = false,
  multiple = false,
  patientContext = {}
}) {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [applying, setApplying] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [pendingPresets, setPendingPresets] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    fetch(`/api/admin/presets?type=${encodeURIComponent(type)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (cancelled) return;
        const list = data.presets || [];
        setPresets(list);
        if (!list.length) {
          setLoadError(data.message || "Nenhum pacote encontrado.");
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("Falha ao carregar pacotes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const options = useMemo(
    () =>
      presets.map((preset) => {
        const examCount = (preset.content?.exams || []).length;
        const itemCount = (preset.content?.items || []).length;
        let hint = "";
        if (type === "exam_order" && examCount) hint = `${examCount} exames`;
        if (type === "supplement_pack" && itemCount) hint = `${itemCount} itens`;
        if (type === "referral_letter" && preset.content?.specialty) {
          hint = preset.content.specialty;
        }
        return {
          value: preset.id,
          label: preset.title,
          hint
        };
      }),
    [presets, type]
  );

  function startApply() {
    if (disabled) return;
    const chosen = multiple
      ? presets.filter((item) => selectedIds.includes(item.id))
      : presets.filter((item) => item.id === selectedId);
    if (!chosen.length) return;
    setPendingPresets(chosen);
  }

  async function confirmApply({ values, complementarySelection }) {
    setApplying(true);
    try {
      await onApply?.(pendingPresets, { values, complementarySelection });
      setPendingPresets([]);
      setSelectedId("");
      setSelectedIds([]);
    } finally {
      setApplying(false);
    }
  }

  const canApply = multiple ? selectedIds.length > 0 : Boolean(selectedId);

  return (
    <div className="space-y-2 rounded-2xl border border-olive-900/10 bg-linen/40 px-3 py-3">
      <p className="text-xs font-medium text-graphite/55">{label}</p>

      <div className="flex items-stretch gap-2">
        <div className="min-w-0 flex-1">
          <SearchableSelect
            icon={Library}
            options={options}
            multiple={multiple}
            value={selectedId}
            values={selectedIds}
            onChange={setSelectedId}
            onChangeMultiple={setSelectedIds}
            disabled={disabled}
            loading={loading}
            placeholder={
              loading
                ? "Carregando pacotes…"
                : options.length
                  ? multiple
                    ? "Buscar e selecionar pacotes"
                    : "Buscar pacote…"
                  : "Nenhum pacote disponível"
            }
            searchPlaceholder="Digite para filtrar…"
            emptyMessage="Nenhum pacote corresponde à busca"
          />
        </div>
        <button
          type="button"
          className={`${btnSecondary()} !h-[42px] shrink-0 self-start`}
          disabled={!canApply || disabled || applying || loading}
          onClick={startApply}
        >
          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Aplicar{multiple && selectedIds.length > 1 ? ` (${selectedIds.length})` : ""}
        </button>
      </div>

      {multiple ? (
        <p className="text-[11px] text-graphite/40">
          Busque e marque um ou mais modelos — as variáveis serão pedidas ao aplicar
        </p>
      ) : !loading && options.length ? (
        <p className="text-[11px] text-graphite/40">
          {options.length} modelos · digite para filtrar
        </p>
      ) : null}

      {loadError && !presets.length ? (
        <p className="text-xs text-rose-700">{loadError}</p>
      ) : null}

      <PresetApplyModal
        open={pendingPresets.length > 0}
        onClose={() => setPendingPresets([])}
        presets={pendingPresets}
        patientContext={patientContext}
        onConfirm={confirmApply}
      />
    </div>
  );
}
