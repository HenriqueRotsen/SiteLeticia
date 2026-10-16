"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { btnSecondary } from "@/components/layout/AppShell";

export default function TablePagination({ page, totalPages, total, pageSize, onPageChange }) {
  if (total <= pageSize) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-olive-900/5 pt-4">
      <p className="text-xs text-graphite/50">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={btnSecondary("!px-3 !py-2")}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={btnSecondary("!px-3 !py-2")}
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
