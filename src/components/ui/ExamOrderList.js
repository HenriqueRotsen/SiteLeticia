"use client";

import { ClipboardList, FlaskConical, Plus, Trash2 } from "lucide-react";
import { Card, btnSecondary, inputClassName } from "@/components/layout/AppShell";
import PresetPicker from "@/components/ui/PresetPicker";
import { mapExamPresetOrder } from "@/lib/presets/format";

function emptyExam() {
  return {
    clientId: crypto.randomUUID(),
    name: "",
    category: "principal",
    whenToRequest: ""
  };
}

function emptyOrder() {
  return {
    clientId: crypto.randomUUID(),
    title: "Pedido de exames",
    exams: [],
    collectionNotes: [],
    observations: ""
  };
}

function ExamPreview({ orders, readOnly = false }) {
  return (
    <Card className={`overflow-hidden p-0 ${readOnly ? "" : "sm:sticky sm:top-5"} sm:p-0`}>
      <div className="border-b border-olive-900/10 bg-gradient-to-br from-amber-50 to-porcelain px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800/70">
          {readOnly ? "Prescrição" : "Prévia para o paciente"}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-graphite">Pedido de exames</h3>
      </div>
      <div className="space-y-3 p-4">
        {orders.length ? (
          orders.map((order) => {
            const principals = (order.exams || []).filter((e) => e.category !== "complementary");
            const comps = (order.exams || []).filter((e) => e.category === "complementary");
            return (
              <div
                key={order.clientId}
                className="rounded-xl border border-amber-100 bg-white px-3.5 py-3"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <ClipboardList className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-graphite">{order.title}</p>
                    <p className="mt-1 text-xs text-graphite/45">
                      {principals.length} principais
                      {comps.length ? ` · ${comps.length} complementares` : ""}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {principals.slice(0, 6).map((exam) => (
                        <li key={exam.clientId} className="text-xs text-graphite/65">
                          {exam.name}
                        </li>
                      ))}
                      {principals.length > 6 ? (
                        <li className="text-xs text-graphite/40">+{principals.length - 6} exames</li>
                      ) : null}
                    </ul>
                    {(order.collectionNotes || []).length ? (
                      <p className="mt-2 border-t border-olive-900/6 pt-2 text-[11px] text-graphite/45">
                        {(order.collectionNotes || []).length} orientações de coleta
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center">
            <FlaskConical className="mx-auto h-6 w-6 text-graphite/20" strokeWidth={1.5} />
            <p className="mt-2 text-xs text-graphite/40">Nenhum pedido</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ExamOrderList({
  orders = [],
  onChange,
  readOnly = false,
  patientName = "",
  patientContext = null
}) {
  const context = patientContext || { patientName };

  function updateOrders(next) {
    onChange?.(next);
  }

  function applyPresets(presets, { values, complementarySelection } = {}) {
    const mapped = presets.map((preset) =>
      mapExamPresetOrder(preset, {
        patientName: context.patientName || patientName,
        variableValues: values || {},
        includeComplementaryNames: complementarySelection?.[preset.id] ?? null
      })
    );
    updateOrders([...orders, ...mapped]);
  }

  function updateOrder(clientId, patch) {
    updateOrders(orders.map((order) => (order.clientId === clientId ? { ...order, ...patch } : order)));
  }

  function updateExam(orderId, examId, patch) {
    updateOrders(
      orders.map((order) =>
        order.clientId === orderId
          ? {
              ...order,
              exams: order.exams.map((exam) =>
                exam.clientId === examId ? { ...exam, ...patch } : exam
              )
            }
          : order
      )
    );
  }

  if (readOnly) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <ExamPreview orders={orders} readOnly />
      </div>
    );
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <FlaskConical className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="font-semibold text-graphite">Pedido de exames</h2>
              <p className="text-xs text-graphite/45">Pacotes prontos + edição livre</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnSecondary()}
              onClick={() => updateOrders([...orders, emptyOrder()])}
            >
              <Plus className="h-4 w-4" />
              Novo pedido
            </button>
          </div>
        </div>

        <PresetPicker
          type="exam_order"
          label="Pacotes de exames"
          multiple
          patientContext={context}
          onApply={applyPresets}
        />

        {!orders.length ? (
          <button
            type="button"
            onClick={() => updateOrders([emptyOrder()])}
            className="flex w-full flex-col items-center rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 px-6 py-14 text-center"
          >
            <FlaskConical className="h-7 w-7 text-amber-700/70" />
            <span className="mt-3 text-sm font-semibold">Começar pedido de exames</span>
          </button>
        ) : null}

        {orders.map((order) => (
          <Card key={order.clientId} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <label className="block flex-1 text-xs text-graphite/55">
                Título do pedido
                <input
                  className={`mt-1 ${inputClassName()}`}
                  value={order.title}
                  onChange={(e) => updateOrder(order.clientId, { title: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="mt-5 text-rose-500"
                onClick={() => updateOrders(orders.filter((o) => o.clientId !== order.clientId))}
                aria-label="Remover pedido"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-graphite/45">
                Exames ({order.exams.length})
              </p>
              <button
                type="button"
                className="text-sm font-medium text-olive-800"
                onClick={() =>
                  updateOrder(order.clientId, { exams: [...order.exams, emptyExam()] })
                }
              >
                + Exame
              </button>
            </div>

            <div className="space-y-2">
              {order.exams.map((exam) => (
                <div
                  key={exam.clientId}
                  className="grid gap-2 rounded-xl border border-olive-900/8 bg-linen/30 p-3 sm:grid-cols-[1fr_140px_auto]"
                >
                  <input
                    className={inputClassName()}
                    placeholder="Nome do exame"
                    value={exam.name}
                    onChange={(e) =>
                      updateExam(order.clientId, exam.clientId, { name: e.target.value })
                    }
                  />
                  <select
                    className={inputClassName()}
                    value={exam.category}
                    onChange={(e) =>
                      updateExam(order.clientId, exam.clientId, { category: e.target.value })
                    }
                  >
                    <option value="principal">Principal</option>
                    <option value="complementary">Complementar</option>
                  </select>
                  <button
                    type="button"
                    className="text-rose-500"
                    onClick={() =>
                      updateOrder(order.clientId, {
                        exams: order.exams.filter((item) => item.clientId !== exam.clientId)
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {exam.category === "complementary" ? (
                    <input
                      className={`sm:col-span-3 ${inputClassName()}`}
                      placeholder="Quando solicitar (opcional)"
                      value={exam.whenToRequest || ""}
                      onChange={(e) =>
                        updateExam(order.clientId, exam.clientId, {
                          whenToRequest: e.target.value
                        })
                      }
                    />
                  ) : null}
                </div>
              ))}
            </div>

            <label className="block text-xs text-graphite/55">
              Orientações de coleta (uma por linha)
              <textarea
                className={`mt-1 min-h-[110px] ${inputClassName()}`}
                value={(order.collectionNotes || []).join("\n")}
                onChange={(e) =>
                  updateOrder(order.clientId, {
                    collectionNotes: e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                  })
                }
              />
            </label>

            <label className="block text-xs text-graphite/55">
              Observações
              <textarea
                className={`mt-1 min-h-[70px] ${inputClassName()}`}
                value={order.observations || ""}
                onChange={(e) => updateOrder(order.clientId, { observations: e.target.value })}
              />
            </label>
          </Card>
        ))}
      </div>

      <ExamPreview orders={orders} />
    </div>
  );
}

export { emptyOrder as emptyExamOrder };
