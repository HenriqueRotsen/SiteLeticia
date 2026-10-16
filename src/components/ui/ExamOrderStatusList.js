"use client";

import Badge from "@/components/ui/Badge";
import { flagLabelPt, isExamDone } from "@/lib/labs/exam-status";

function formatResultValue(result) {
  if (!result) return "—";
  const raw = result.value_text ?? result.value;
  if (raw == null || raw === "") return "—";
  return `${raw}${result.unit ? ` ${result.unit}` : ""}`;
}

function resultBadge(result) {
  if (!result) return { variant: "neutral", label: "Pendente" };
  if (result.flag === "normal") return { variant: "success", label: "Normal" };
  if (result.flag === "high" || result.flag === "low") {
    return { variant: "warning", label: flagLabelPt(result.flag) };
  }
  return { variant: "neutral", label: flagLabelPt(result.flag) };
}

export default function ExamOrderStatusList({ orders = [], emptyMessage = "Nenhum pedido de exames." }) {
  if (!orders.length) {
    return <p className="text-sm text-graphite/45">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const exams = order.exams || [];
        const doneCount = exams.filter((exam) => isExamDone(exam)).length;

        return (
          <div
            key={order.id || order.clientId}
            className="overflow-hidden rounded-2xl border border-olive-900/8 bg-white/80"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-olive-900/6 bg-linen/50 px-4 py-3">
              <p className="font-semibold text-graphite">{order.title || "Pedido de exames"}</p>
              <p className="text-xs text-graphite/45">
                {doneCount}/{exams.length} feitos
              </p>
            </div>
            <ul className="divide-y divide-olive-900/6">
              {exams.map((exam, index) => {
                const done = isExamDone(exam);
                const badge = done
                  ? resultBadge(exam.result)
                  : { variant: "neutral", label: "Pendente" };

                return (
                  <li
                    key={exam.clientId || `${order.id}-${index}`}
                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-graphite">{exam.name}</p>
                      {exam.category === "complementary" && exam.whenToRequest ? (
                        <p className="mt-0.5 text-xs text-graphite/45">{exam.whenToRequest}</p>
                      ) : null}
                      {done ? (
                        <p className="mt-1 text-sm tabular-nums text-graphite/70">
                          Valor: {formatResultValue(exam.result)}
                          {exam.result?.ref_min != null || exam.result?.ref_max != null ? (
                            <span className="text-graphite/45">
                              {" "}
                              · Ref. {exam.result.ref_min ?? "—"} – {exam.result.ref_max ?? "—"}
                            </span>
                          ) : null}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-graphite/40">Aguardando laudo correspondente</p>
                      )}
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
