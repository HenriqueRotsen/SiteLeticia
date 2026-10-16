"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export default function SortableTh({ label, sortKey, activeKey, direction, onSort }) {
  const active = activeKey === sortKey;
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th className="whitespace-nowrap py-2 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-graphite/50">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 transition hover:text-olive-800 ${
          active ? "text-olive-800" : ""
        }`}
      >
        {label}
        <Icon className="h-3.5 w-3.5 opacity-70" strokeWidth={1.75} />
      </button>
    </th>
  );
}
