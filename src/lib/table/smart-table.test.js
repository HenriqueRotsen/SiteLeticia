import { describe, expect, it } from "vitest";
import { applyFilters, matchesQuery, pageNumbers, paginate, sortRows } from "@/lib/table/smart-table";

describe("matchesQuery", () => {
  const fields = ["Valcilene Carvalho", "61991774192", "Emagrecimento"];

  it("ignores accents, case and word order", () => {
    expect(matchesQuery(["Letícia Cunha"], "cunha leticia")).toBe(true);
    expect(matchesQuery(fields, "carvalho emag")).toBe(true);
    expect(matchesQuery(fields, "carvalho hipertrofia")).toBe(false);
  });

  it("finds formatted phones by digits", () => {
    expect(matchesQuery(fields, "(61) 99177-4192")).toBe(true);
    expect(matchesQuery(fields, "+55 61 99177-4192")).toBe(true);
    expect(matchesQuery(fields, "4192")).toBe(true);
    expect(matchesQuery(fields, "(61) 3333-0000")).toBe(false);
  });

  it("matches everything on empty query", () => {
    expect(matchesQuery(fields, "  ")).toBe(true);
  });
});

describe("applyFilters", () => {
  const filters = [
    { key: "status", predicate: (row, value) => row.status === value },
    { key: "account", defaultValue: "any", predicate: (row, value) => (value === "yes") === row.hasAccount }
  ];
  const rows = [
    { id: 1, status: "a", hasAccount: true },
    { id: 2, status: "b", hasAccount: false },
    { id: 3, status: "a", hasAccount: false }
  ];

  it("skips filters on their default value", () => {
    expect(applyFilters(rows, filters, { status: "all", account: "any" })).toHaveLength(3);
  });

  it("combines active filters", () => {
    expect(applyFilters(rows, filters, { status: "a", account: "no" }).map((r) => r.id)).toEqual([3]);
  });
});

describe("sortRows", () => {
  const column = { sortValue: (row) => row.value };

  it("sorts text naturally and keeps empty values last", () => {
    const rows = [{ value: "Ana 10" }, { value: null }, { value: "ana 2" }, { value: "Bruno" }];
    expect(sortRows(rows, column, "asc").map((r) => r.value)).toEqual(["ana 2", "Ana 10", "Bruno", null]);
    expect(sortRows(rows, column, "desc").map((r) => r.value)).toEqual(["Bruno", "Ana 10", "ana 2", null]);
  });

  it("sorts numbers", () => {
    const rows = [{ value: 10 }, { value: 2 }, { value: 33 }];
    expect(sortRows(rows, column, "asc").map((r) => r.value)).toEqual([2, 10, 33]);
  });
});

describe("paginate", () => {
  const rows = Array.from({ length: 23 }, (_, index) => index + 1);

  it("returns the page slice and range", () => {
    const result = paginate(rows, 3, 10);
    expect(result).toMatchObject({ page: 3, totalPages: 3, total: 23, from: 21, to: 23 });
    expect(result.rows).toEqual([21, 22, 23]);
  });

  it("clamps out-of-range pages", () => {
    expect(paginate(rows, 9, 10).page).toBe(3);
    expect(paginate([], 2, 10)).toMatchObject({ page: 1, totalPages: 1, from: 0, to: 0 });
  });
});

describe("pageNumbers", () => {
  it("lists every page when few", () => {
    expect(pageNumbers(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("adds ellipses around the current page", () => {
    expect(pageNumbers(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
    expect(pageNumbers(1, 12)).toEqual([1, 2, "…", 12]);
  });
});
