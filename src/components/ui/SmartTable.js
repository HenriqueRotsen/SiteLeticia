"use client";

// Tabela padrão do sistema: busca inteligente, filtros, ordenação e paginação.
// No computador vira tabela; no celular, cartões (sem rolagem lateral).
//
// Colunas: { key, label, render?, sortValue?, sortLabels?: [asc, desc], mobile? }
//   mobile: "title" | "subtitle" | "badges" | "actions" | "hidden" | undefined (campo com rótulo)
// Filtros: { key, label, icon?, options: [{ value, label }], defaultValue = "all", predicate(row, value) }

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ArrowDownUp, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import FilterSelect from "@/components/ui/FilterSelect";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  applyFilters,
  matchesQuery,
  pageNumbers,
  paginate,
  sortRows
} from "@/lib/table/smart-table";

function initialFilterValues(filters, initial) {
  const values = {};
  for (const filter of filters) values[filter.key] = initial?.[filter.key] ?? filter.defaultValue ?? "all";
  return values;
}

function plural(count, [one, many]) {
  return `${count} ${count === 1 ? one : many}`;
}

function SortHeader({ column, sort, onSort }) {
  if (!column.sortValue) {
    return (
      <th className="whitespace-nowrap px-3 pb-3 text-left text-xs font-semibold uppercase tracking-wide text-graphite/45 first:pl-0">
        {column.label}
      </th>
    );
  }
  const active = sort.key === column.key;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className="whitespace-nowrap px-3 pb-3 text-left text-xs font-semibold uppercase tracking-wide text-graphite/45 first:pl-0"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className={`inline-flex items-center gap-1.5 uppercase transition hover:text-olive-800 ${active ? "text-olive-800" : ""}`}
      >
        {column.label}
        <Icon className="h-3.5 w-3.5 opacity-70" strokeWidth={1.75} />
      </button>
    </th>
  );
}

function Pagination({ pagination, pageSize, sizeOptions, onPage, onPageSize, itemLabel }) {
  const { page, totalPages, total, from, to } = pagination;
  if (totalPages <= 1 && pageSize <= sizeOptions[0]) {
    return null;
  }
  const navButton =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-olive-900/10 bg-white px-2.5 text-sm font-semibold text-graphite/75 transition hover:bg-linen disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-olive-900/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between gap-3 text-xs text-graphite/55 sm:justify-start">
        <span>
          {from}–{to} de {plural(total, itemLabel)}
        </span>
        <label className="inline-flex items-center gap-1.5">
          <span className="hidden sm:inline">Por página</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSize(Number(event.target.value))}
            className="rounded-lg border border-olive-900/10 bg-white px-2 py-1 text-xs font-semibold text-graphite outline-none focus:border-olive-500"
            aria-label="Itens por página"
          >
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between gap-1.5 sm:justify-end" aria-label="Paginação">
          <button type="button" className={navButton} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Página anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-graphite/60 sm:hidden">
            Página {page} de {totalPages}
          </span>
          <div className="hidden items-center gap-1.5 sm:flex">
            {pageNumbers(page, totalPages).map((item, index) =>
              item === "…" ? (
                <span key={`gap-${index}`} className="px-1 text-graphite/35">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPage(item)}
                  aria-current={item === page ? "page" : undefined}
                  className={
                    item === page
                      ? "inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-olive-700 px-2.5 text-sm font-semibold text-white"
                      : navButton
                  }
                >
                  {item}
                </button>
              )
            )}
          </div>
          <button
            type="button"
            className={navButton}
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}

function MobileCard({ row, columns, onOpen }) {
  const cell = (column) => (column.render ? column.render(row) : row[column.key]);
  const title = columns.find((c) => c.mobile === "title");
  const subtitle = columns.filter((c) => c.mobile === "subtitle");
  const badges = columns.filter((c) => c.mobile === "badges");
  const actions = columns.filter((c) => c.mobile === "actions");
  const fields = columns.filter((c) => !c.mobile);

  return (
    <li
      className="rounded-2xl border border-olive-900/10 bg-white p-4 shadow-xs"
      onDoubleClick={onOpen ? () => onOpen(row) : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 break-words">
          {title ? <div className="text-[15px] font-semibold text-graphite">{cell(title)}</div> : null}
          {subtitle.map((column) => (
            <div key={column.key} className="mt-0.5 text-sm text-graphite/60">
              {cell(column)}
            </div>
          ))}
        </div>
        {badges.length ? (
          <div className="flex shrink-0 flex-col items-end gap-1">
            {badges.map((column) => (
              <div key={column.key}>{cell(column)}</div>
            ))}
          </div>
        ) : null}
      </div>
      {fields.length ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-olive-900/5 pt-3">
          {fields.map((column) => (
            <div key={column.key} className="min-w-0">
              <dt className="text-[11px] font-medium text-graphite/45">{column.label}</dt>
              <dd className="mt-0.5 break-words text-sm text-graphite/80">{cell(column)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {actions.length ? (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3 border-t border-olive-900/5 pt-3 text-sm">
          {actions.map((column) => (
            <div key={column.key}>{cell(column)}</div>
          ))}
        </div>
      ) : null}
    </li>
  );
}

export default function SmartTable({
  rows = [],
  columns,
  rowKey = "id",
  searchFields,
  searchPlaceholder = "Buscar…",
  filters = [],
  initialFilters,
  defaultSort,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  itemLabel = ["registro", "registros"],
  loading = false,
  emptyMessage = "Nenhum registro.",
  noResultsMessage = "Nada encontrado com esses filtros.",
  toolbarExtra = null,
  onRowDoubleClick,
  rowClassName
}) {
  const rootRef = useRef(null);
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState(() => initialFilterValues(filters, initialFilters));
  const [sort, setSort] = useState(defaultSort || { key: null, dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const sortable = columns.filter((column) => column.sortValue);
  const hasToolbar = Boolean(searchFields) || filters.length > 0 || sortable.length > 0;

  const visible = useMemo(() => {
    let result = rows;
    if (searchFields && query.trim()) result = result.filter((row) => matchesQuery(searchFields(row), query));
    result = applyFilters(result, filters, filterValues);
    const column = columns.find((c) => c.key === sort.key);
    return sortRows(result, column, sort.dir);
  }, [rows, query, filters, filterValues, columns, sort, searchFields]);

  const pagination = useMemo(() => paginate(visible, page, pageSize), [visible, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [query, filterValues, sort, pageSize]);

  const activeFilters = filters.filter((filter) => filterValues[filter.key] !== (filter.defaultValue ?? "all"));
  const hasActive = activeFilters.length > 0 || Boolean(query.trim());

  function changePage(next) {
    setPage(next);
    const top = rootRef.current?.getBoundingClientRect().top;
    if (top != null && top < 0) rootRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleSort(key) {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  function clearAll() {
    setQuery("");
    setFilterValues(initialFilterValues(filters));
  }

  const sortOptions = sortable.flatMap((column) => {
    const [asc, desc] = column.sortLabels || ["crescente", "decrescente"];
    return [
      { value: `${column.key}:asc`, label: `${column.label} · ${asc}` },
      { value: `${column.key}:desc`, label: `${column.label} · ${desc}` }
    ];
  });

  return (
    <div ref={rootRef} className="scroll-mt-24">
      {hasToolbar ? (
        <div className="mb-4 space-y-3">
          <div className="flex gap-2">
            {searchFields ? (
              <label className="relative block min-w-0 flex-1">
                <span className="sr-only">Buscar</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/40" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-xl border border-olive-900/10 bg-white py-2.5 pl-9 pr-9 text-sm text-graphite outline-none transition placeholder:text-graphite/40 focus:border-olive-500 focus:ring-2 focus:ring-olive-100"
                  type="search"
                  inputMode="search"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-graphite/40 hover:text-graphite"
                    aria-label="Limpar busca"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </label>
            ) : (
              <div className="flex-1" />
            )}
            {filters.length || sortOptions.length ? (
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition sm:hidden ${
                  activeFilters.length
                    ? "border-olive-400 bg-olive-50 text-olive-900"
                    : "border-olive-900/10 bg-white text-graphite/75"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={1.85} />
                Filtros{activeFilters.length ? ` (${activeFilters.length})` : ""}
              </button>
            ) : null}
            {toolbarExtra}
          </div>

          {filters.length || sortOptions.length ? (
            <div
              className={`${filtersOpen ? "grid" : "hidden"} grid-cols-1 gap-2 sm:grid sm:grid-cols-2 lg:flex lg:flex-wrap [&>*]:lg:min-w-[11rem] [&>*]:lg:flex-1`}
            >
              {filters.map((filter) => (
                <FilterSelect
                  key={filter.key}
                  label={filter.label}
                  icon={filter.icon}
                  options={filter.options}
                  defaultValue={filter.defaultValue ?? "all"}
                  value={filterValues[filter.key]}
                  onChange={(value) => setFilterValues((current) => ({ ...current, [filter.key]: value }))}
                />
              ))}
              {sortOptions.length ? (
                <div className="xl:hidden">
                  <FilterSelect
                    label="Ordenar por"
                    icon={ArrowDownUp}
                    options={sortOptions}
                    defaultValue={defaultSort ? `${defaultSort.key}:${defaultSort.dir}` : ""}
                    value={sort.key ? `${sort.key}:${sort.dir}` : ""}
                    onChange={(value) => {
                      const [key, dir] = value.split(":");
                      setSort({ key, dir });
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex min-h-6 items-center justify-between gap-3">
            <p className="text-xs text-graphite/50">
              {loading
                ? "Carregando…"
                : visible.length === rows.length
                  ? plural(rows.length, itemLabel)
                  : `${visible.length} de ${plural(rows.length, itemLabel)}`}
            </p>
            {hasActive ? (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-olive-800 transition hover:bg-olive-50"
              >
                <X className="h-3 w-3" strokeWidth={2.25} />
                Limpar filtros
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {loading && !rows.length ? (
        <p className="py-8 text-center text-sm text-graphite/45">Carregando…</p>
      ) : !rows.length ? (
        <p className="py-8 text-center text-sm text-graphite/45">{emptyMessage}</p>
      ) : !visible.length ? (
        <p className="py-8 text-center text-sm text-graphite/45">{noResultsMessage}</p>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
            {pagination.rows.map((row) => (
              <MobileCard key={row[rowKey]} row={row} columns={columns.filter((c) => c.mobile !== "hidden")} onOpen={onRowDoubleClick} />
            ))}
          </ul>

          <div className="hidden overflow-x-auto xl:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-olive-900/10">
                  {columns
                    .filter((column) => !column.desktopHidden)
                    .map((column) => (
                      <SortHeader key={column.key} column={column} sort={sort} onSort={toggleSort} />
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-900/5">
                {pagination.rows.map((row) => (
                  <tr
                    key={row[rowKey]}
                    className={`transition hover:bg-linen/70 ${onRowDoubleClick ? "cursor-pointer" : ""} ${rowClassName?.(row) || ""}`}
                    onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row) : undefined}
                    title={onRowDoubleClick ? "Clique duplo para abrir" : undefined}
                  >
                    {columns
                      .filter((column) => !column.desktopHidden)
                      .map((column) => (
                        <td
                          key={column.key}
                          className={`px-3 py-3.5 align-middle text-graphite/70 first:pl-0 ${column.nowrap ? "whitespace-nowrap" : ""}`}
                        >
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={pagination}
            pageSize={pageSize}
            onPage={changePage}
            onPageSize={setPageSize}
            sizeOptions={[...new Set([initialPageSize, ...PAGE_SIZE_OPTIONS])].sort((a, b) => a - b)}
            itemLabel={itemLabel}
          />
        </>
      )}
    </div>
  );
}
