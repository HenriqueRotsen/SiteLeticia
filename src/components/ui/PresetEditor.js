"use client";

import { Plus, Trash2 } from "lucide-react";
import { btnSecondary, inputClassName } from "@/components/layout/AppShell";
import VariableInsertButton, { VariableField } from "@/components/ui/VariableInsertButton";
import SupplementEntriesEditor, { SupplementAddButtons, SupplementPreview } from "@/components/ui/SupplementEntriesEditor";

function appendToken(value, token) {
  const base = String(value || "");
  if (!base) return token;
  if (/\s$/.test(base)) return `${base}${token}`;
  return `${base} ${token}`;
}

// content.entries chega já no formato novo (a página converte presets antigos ao abrir).
function SupplementEditor({ content, onChange }) {
  const entries = content.entries || [];

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs leading-5 text-graphite/55">
            <strong className="font-semibold text-graphite">Combo</strong>: vários componentes numa cápsula só, com uma
            posologia. <strong className="font-semibold text-graphite">Avulso</strong>: um suplemento com posologia própria.
          </p>
          <SupplementAddButtons entries={entries} onChange={(next) => onChange({ ...content, entries: next })} />
        </div>
        <SupplementEntriesEditor entries={entries} onChange={(next) => onChange({ ...content, entries: next })} />
        <VariableField
          label="Notas do preset"
          onInsert={(token) => onChange({ ...content, notes: appendToken(content.notes, token) })}
        >
          <textarea
            className={`min-h-[70px] ${inputClassName()}`}
            value={content.notes || ""}
            onChange={(e) => onChange({ ...content, notes: e.target.value })}
            placeholder="Observações gerais. Use {{}} para variáveis, como {{paciente}}."
          />
        </VariableField>
      </div>
      <div className="lg:sticky lg:top-0">
        <SupplementPreview entries={entries} />
      </div>
    </div>
  );
}

function ExamEditor({ content, onChange }) {
  const exams = content.exams || [];

  function updateExam(index, patch) {
    const next = exams.map((exam, i) => (i === index ? { ...exam, ...patch } : exam));
    onChange({ ...content, exams: next });
  }

  function removeExam(index) {
    onChange({ ...content, exams: exams.filter((_, i) => i !== index) });
  }

  function addExam() {
    onChange({
      ...content,
      exams: [...exams, { name: "", category: "principal", whenToRequest: "" }]
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-graphite/45">
          Exames ({exams.length})
        </p>
        <div className="flex items-center gap-2">
          <VariableInsertButton
            onInsert={(token) =>
              onChange({
                ...content,
                observations: appendToken(content.observations, token)
              })
            }
          />
          <button type="button" className={btnSecondary()} onClick={addExam}>
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      <p className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2 text-[11px] text-amber-950/80">
        Variáveis do cabeçalho do pedido:{" "}
        <code className="font-medium">{"{{paciente}}"}</code>,{" "}
        <code className="font-medium">{"{{data_nascimento}}"}</code>,{" "}
        <code className="font-medium">{"{{sexo}}"}</code>,{" "}
        <code className="font-medium">{"{{data_solicitacao}}"}</code>,{" "}
        <code className="font-medium">{"{{nutricionista}}"}</code>,{" "}
        <code className="font-medium">{"{{crn}}"}</code>,{" "}
        <code className="font-medium">{"{{telefone}}"}</code>,{" "}
        <code className="font-medium">{"{{email}}"}</code>,{" "}
        <code className="font-medium">{"{{endereco}}"}</code>. Use o botão {"{{}}"} nos textos.
      </p>

      {exams.map((exam, index) => (
        <div
          key={`exam-${index}`}
          className="space-y-2 rounded-2xl border border-amber-100 bg-amber-50/30 p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-amber-900">Exame {index + 1}</p>
            <button type="button" className="text-rose-500" onClick={() => removeExam(index)}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <VariableField
            label="Nome"
            onInsert={(token) => updateExam(index, { name: appendToken(exam.name, token) })}
          >
            <input
              className={inputClassName()}
              value={exam.name || ""}
              onChange={(e) => updateExam(index, { name: e.target.value })}
              placeholder="Nome do exame"
            />
          </VariableField>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs font-medium text-graphite/55">
              Tipo
              <select
                className={`mt-1 ${inputClassName()}`}
                value={exam.category || "principal"}
                onChange={(e) => updateExam(index, { category: e.target.value })}
              >
                <option value="principal">Principal</option>
                <option value="complementary">Complementar (variável)</option>
              </select>
            </label>
            {exam.category === "complementary" ? (
              <VariableField
                label="Quando solicitar"
                onInsert={(token) =>
                  updateExam(index, { whenToRequest: appendToken(exam.whenToRequest, token) })
                }
              >
                <input
                  className={inputClassName()}
                  value={exam.whenToRequest || ""}
                  onChange={(e) => updateExam(index, { whenToRequest: e.target.value })}
                  placeholder="Indicação clínica"
                />
              </VariableField>
            ) : (
              <div />
            )}
          </div>
        </div>
      ))}

      <VariableField
        label="Orientações de coleta (uma por linha)"
        onInsert={(token) => {
          const lines = [...(content.collectionNotes || [])];
          if (!lines.length) lines.push(token);
          else lines[lines.length - 1] = appendToken(lines[lines.length - 1], token);
          onChange({ ...content, collectionNotes: lines });
        }}
      >
        <textarea
          className={`min-h-[110px] ${inputClassName()}`}
          value={(content.collectionNotes || []).join("\n")}
          onChange={(e) =>
            onChange({
              ...content,
              collectionNotes: e.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
            })
          }
        />
      </VariableField>

      <VariableField
        label="Observações"
        onInsert={(token) =>
          onChange({ ...content, observations: appendToken(content.observations, token) })
        }
      >
        <textarea
          className={`min-h-[70px] ${inputClassName()}`}
          value={content.observations || ""}
          onChange={(e) => onChange({ ...content, observations: e.target.value })}
          placeholder="Ex.: Solicito envio dos resultados de {{paciente}}..."
        />
      </VariableField>
    </div>
  );
}

function ReferralEditor({ content, onChange }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs font-medium text-graphite/55">
          Especialidade
          <input
            className={`mt-1 ${inputClassName()}`}
            value={content.specialty || ""}
            onChange={(e) => onChange({ ...content, specialty: e.target.value })}
            placeholder="Ex.: Endocrinologia"
          />
        </label>
        <label className="block text-xs font-medium text-graphite/55">
          Urgência
          <select
            className={`mt-1 ${inputClassName()}`}
            value={content.urgency || "routine"}
            onChange={(e) => onChange({ ...content, urgency: e.target.value })}
          >
            <option value="routine">Rotina</option>
            <option value="priority">Prioritário</option>
          </select>
        </label>
      </div>

      <VariableField
        label="Motivo (resumo)"
        onInsert={(token) => onChange({ ...content, reason: appendToken(content.reason, token) })}
      >
        <input
          className={inputClassName()}
          value={content.reason || ""}
          onChange={(e) => onChange({ ...content, reason: e.target.value })}
          placeholder="Solicitação de parecer médico"
        />
      </VariableField>

      <VariableField
        label="Texto do parecer"
        onInsert={(token) =>
          onChange({ ...content, bodyText: appendToken(content.bodyText, token) })
        }
      >
        <textarea
          className={`min-h-[220px] ${inputClassName()}`}
          value={content.bodyText || ""}
          onChange={(e) => onChange({ ...content, bodyText: e.target.value })}
          placeholder="Texto do parecer. Use o botão {{}} para variáveis (ex.: {{paciente}}, {{data}}, {{valor}})."
        />
      </VariableField>

      <VariableField
        label="Observações"
        onInsert={(token) => onChange({ ...content, notes: appendToken(content.notes, token) })}
      >
        <input
          className={inputClassName()}
          value={content.notes || ""}
          onChange={(e) => onChange({ ...content, notes: e.target.value })}
          placeholder="Opcional"
        />
      </VariableField>
    </div>
  );
}

/**
 * Editor amigável de presets — sem JSON.
 */
export default function PresetEditor({ type, content = {}, onChange }) {
  if (type === "supplement_pack") {
    return <SupplementEditor content={content} onChange={onChange} />;
  }
  if (type === "exam_order") {
    return <ExamEditor content={content} onChange={onChange} />;
  }
  if (type === "referral_letter") {
    return <ReferralEditor content={content} onChange={onChange} />;
  }
  return <p className="text-sm text-graphite/50">Tipo de preset não suportado.</p>;
}
