"use client";

import { useEffect, useMemo, useState } from "react";
import { btnPrimary, btnSecondary, inputClassName } from "@/components/layout/AppShell";
import Modal from "@/components/ui/Modal";
import {
  EXAM_HEADER_VARIABLE_KEYS,
  buildDefaultVariableValues,
  extractVariableKeys,
  getVariableMeta,
  groupVariablesForForm
} from "@/lib/presets/variables";

const GROUP_TITLES = {
  paciente: "Identificação do paciente",
  profissional: "Profissional",
  clinico: "Campos clínicos",
  custom: "Outras variáveis"
};

/**
 * Modal: preenche variáveis dos modelos selecionados (e complementares de exames).
 */
export default function PresetApplyModal({
  open,
  onClose,
  presets = [],
  patientContext = {},
  onConfirm
}) {
  const [values, setValues] = useState({});
  const [selectedComplementary, setSelectedComplementary] = useState({});

  const isExam = presets.some((item) => item.type === "exam_order");

  const variableKeys = useMemo(() => {
    const keys = new Set();
    for (const preset of presets) {
      extractVariableKeys(preset.content || {}).forEach((key) => keys.add(key));
      extractVariableKeys(preset.title || "").forEach((key) => keys.add(key));
    }
    if (isExam) {
      EXAM_HEADER_VARIABLE_KEYS.forEach((key) => keys.add(key));
    }
    return [...keys];
  }, [presets, isExam]);

  const complementaryByPreset = useMemo(() => {
    const map = {};
    for (const preset of presets) {
      if (preset.type !== "exam_order") continue;
      const comps = (preset.content?.exams || []).filter(
        (exam) => exam.category === "complementary"
      );
      if (comps.length) map[preset.id] = comps;
    }
    return map;
  }, [presets]);

  const patientKey = [
    patientContext.patientName,
    patientContext.birthDate,
    patientContext.sex
  ].join("|");
  const complementaryKey = JSON.stringify(
    Object.fromEntries(
      Object.entries(complementaryByPreset).map(([id, exams]) => [
        id,
        exams.map((exam) => exam.name)
      ])
    )
  );
  const variablesKey = variableKeys.join(",");

  useEffect(() => {
    if (!open) return;
    setValues(buildDefaultVariableValues(variableKeys, patientContext));
    const next = {};
    for (const [presetId, exams] of Object.entries(complementaryByPreset)) {
      next[presetId] = Object.fromEntries(exams.map((exam, index) => [`${index}:${exam.name}`, true]));
    }
    setSelectedComplementary(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keys capture relevant context
  }, [open, variablesKey, complementaryKey, patientKey]);

  const groups = groupVariablesForForm(variableKeys);
  const hasComplementary = Object.keys(complementaryByPreset).length > 0;

  function confirm() {
    const complementarySelection = {};
    for (const [presetId, flags] of Object.entries(selectedComplementary)) {
      complementarySelection[presetId] = Object.entries(flags)
        .filter(([, enabled]) => enabled)
        .map(([token]) => token.split(":").slice(1).join(":"));
    }
    onConfirm?.({
      values,
      complementarySelection
    });
  }

  if (!presets.length) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        presets.length === 1
          ? `Aplicar: ${presets[0].title}`
          : `Aplicar ${presets.length} modelos`
      }
      size="lg"
    >
      <div className="space-y-5">
        <p className="text-sm text-graphite/60">
          Preencha as variáveis dos modelos selecionados. Campos do paciente já vêm sugeridos.
        </p>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <span
              key={preset.id}
              className="rounded-full border border-olive-900/10 bg-linen px-3 py-1 text-xs font-medium text-graphite/70"
            >
              {preset.title}
            </span>
          ))}
        </div>

        {variableKeys.length ? (
          <div className="space-y-4">
            {Object.entries(groups).map(([group, items]) =>
              items.length ? (
                <div key={group}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite/45">
                    {GROUP_TITLES[group] || group}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((meta) => (
                      <label key={meta.key} className="block text-xs font-medium text-graphite/55">
                        {meta.label}
                        <span className="ml-1 font-normal text-graphite/35">
                          {`{{${meta.key}}}`}
                        </span>
                        <input
                          className={`mt-1 ${inputClassName()}`}
                          value={values[meta.key] || ""}
                          onChange={(e) =>
                            setValues((current) => ({ ...current, [meta.key]: e.target.value }))
                          }
                          placeholder={getVariableMeta(meta.key).label}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        ) : (
          <p className="text-sm text-graphite/50">Nenhuma variável neste modelo.</p>
        )}

        {hasComplementary ? (
          <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
            <div>
              <p className="text-sm font-semibold text-amber-950">Exames complementares</p>
              <p className="text-xs text-amber-900/70">
                Marque apenas os que deseja incluir neste pedido.
              </p>
            </div>
            {Object.entries(complementaryByPreset).map(([presetId, exams]) => {
              const preset = presets.find((item) => item.id === presetId);
              return (
                <div key={presetId} className="space-y-2">
                  {presets.length > 1 ? (
                    <p className="text-xs font-semibold text-graphite/55">{preset?.title}</p>
                  ) : null}
                  {exams.map((exam, index) => {
                    const token = `${index}:${exam.name}`;
                    const checked = selectedComplementary[presetId]?.[token] !== false;
                    return (
                      <label
                        key={token}
                        className="flex cursor-pointer items-start gap-2 rounded-xl border border-amber-100/80 bg-white px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          onChange={(e) =>
                            setSelectedComplementary((current) => ({
                              ...current,
                              [presetId]: {
                                ...current[presetId],
                                [token]: e.target.checked
                              }
                            }))
                          }
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-graphite">
                            {exam.name}
                          </span>
                          {exam.whenToRequest ? (
                            <span className="mt-0.5 block text-xs text-graphite/50">
                              {exam.whenToRequest}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-olive-900/8 pt-4">
          <button type="button" className={btnSecondary()} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className={btnPrimary()} onClick={confirm}>
            Aplicar modelo{presets.length > 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </Modal>
  );
}
