"use client";

const STEPS = [
  { id: 1, label: "Prescrição Dietética" },
  { id: 2, label: "Prescrição de Suplementação" },
  { id: 3, label: "Encaminhamentos" }
];

/**
 * Stepper horizontal limpo para o fluxo de publicação do plano.
 */
export default function PlanWizardStepper({ step, maxReached = 1, onStepChange }) {
  return (
    <nav aria-label="Etapas da prescrição" className="w-full">
      <ol className="flex items-center gap-0">
        {STEPS.map((item, index) => {
          const active = step === item.id;
          const done = step > item.id;
          const reachable = item.id <= maxReached;
          const isLast = index === STEPS.length - 1;

          return (
            <li key={item.id} className={`flex items-center ${isLast ? "shrink-0" : "min-w-0 flex-1"}`}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onStepChange?.(item.id)}
                className={`flex items-center gap-2 rounded-xl px-1 py-1 text-left transition ${
                  reachable ? "cursor-pointer" : "cursor-default opacity-50"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                    active
                      ? "bg-olive-800 text-white shadow-sm"
                      : done
                        ? "bg-olive-600 text-white"
                        : "border border-olive-900/15 bg-white text-graphite/45"
                  }`}
                >
                  {item.id}
                </span>
                <span
                  className={`hidden text-sm font-medium sm:block ${
                    active ? "text-graphite" : done ? "text-olive-900" : "text-graphite/45"
                  }`}
                >
                  {item.label}
                </span>
              </button>

              {!isLast ? (
                <div
                  className={`mx-2 h-px min-w-[24px] flex-1 ${
                    done ? "bg-olive-500" : "bg-olive-900/15"
                  }`}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
