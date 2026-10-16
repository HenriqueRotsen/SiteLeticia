import { describe, expect, it } from "vitest";
import {
  filterAppointments,
  paginateRows,
  sortAppointments
} from "@/lib/appointments/table-utils";

const rows = [
  {
    id: "1",
    starts_at: "2026-10-20T12:00:00.000Z",
    status: "scheduled",
    payment_status: "pending",
    amount_cents: 20000,
    patients: { full_name: "Ana Silva" }
  },
  {
    id: "2",
    starts_at: "2026-10-10T12:00:00.000Z",
    status: "cancelled",
    payment_status: "waived",
    amount_cents: 10000,
    patients: { full_name: "Bruno Costa" }
  },
  {
    id: "3",
    starts_at: "2026-11-01T12:00:00.000Z",
    status: "scheduled",
    payment_status: "paid",
    amount_cents: 35000,
    patients: { full_name: "Ana Paula" }
  }
];

describe("appointments table utils", () => {
  it("filters by smart query and payment", () => {
    const filtered = filterAppointments(
      rows,
      { query: "ana", period: "all", status: "all", paymentStatus: "paid" },
      { includePatient: true }
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("3");
  });

  it("sorts by amount ascending", () => {
    const sorted = sortAppointments(rows, "amount", "asc");
    expect(sorted.map((r) => r.id)).toEqual(["2", "1", "3"]);
  });

  it("paginates rows", () => {
    const page = paginateRows(rows, 1, 2);
    expect(page.totalPages).toBe(2);
    expect(page.rows).toHaveLength(2);
  });
});
