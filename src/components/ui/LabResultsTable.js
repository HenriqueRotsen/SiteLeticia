"use client";

// Resultados de um exame (marcador, valor, referência, status) com busca, filtro e páginas.

import { Activity } from "lucide-react";
import Badge from "@/components/ui/Badge";
import SmartTable from "@/components/ui/SmartTable";

const FLAG_LABELS = { high: "Acima", low: "Abaixo", normal: "Normal" };
const FLAG_VARIANTS = { high: "danger", low: "warning", normal: "success" };
const FLAG_ORDER = { high: 0, low: 1, normal: 2 };

const FILTERS = [
  {
    key: "flag",
    label: "Resultado",
    icon: Activity,
    options: [
      { value: "all", label: "Todos" },
      { value: "out", label: "Fora da referência" },
      { value: "high", label: "Acima" },
      { value: "low", label: "Abaixo" },
      { value: "normal", label: "Normal" }
    ],
    predicate: (row, value) => (value === "out" ? row.flag === "high" || row.flag === "low" : row.flag === value)
  }
];

function formatReference(row) {
  if (row.ref_min == null && row.ref_max == null) return "—";
  return `${row.ref_min ?? "—"} – ${row.ref_max ?? "—"}`;
}

export default function LabResultsTable({ results = [] }) {
  return (
    <SmartTable
      rows={results}
      pageSize={15}
      itemLabel={["marcador", "marcadores"]}
      searchPlaceholder="Buscar marcador…"
      searchFields={(row) => [row.marker_name, FLAG_LABELS[row.flag]]}
      filters={FILTERS}
      columns={[
        {
          key: "marker",
          label: "Marcador",
          mobile: "title",
          sortValue: (row) => row.marker_name,
          sortLabels: ["A–Z", "Z–A"],
          render: (row) => <span className="font-medium text-graphite">{row.marker_name}</span>
        },
        {
          key: "value",
          label: "Valor",
          nowrap: true,
          render: (row) => `${row.value ?? row.value_text ?? "—"} ${row.unit || ""}`.trim()
        },
        { key: "reference", label: "Referência", nowrap: true, render: formatReference },
        {
          key: "flag",
          label: "Status",
          mobile: "badges",
          sortValue: (row) => FLAG_ORDER[row.flag] ?? null,
          sortLabels: ["alterados primeiro", "normais primeiro"],
          render: (row) =>
            FLAG_LABELS[row.flag] ? (
              <Badge variant={FLAG_VARIANTS[row.flag]}>{FLAG_LABELS[row.flag]}</Badge>
            ) : (
              <span className="hidden text-graphite/35 xl:inline">—</span>
            )
        }
      ]}
    />
  );
}
