import { describe, expect, it } from "vitest";
import { safeMeetLink, selectUpcomingAppointments } from "./upcoming";

const now = new Date("2026-11-17T12:00:00Z");

describe("selectUpcomingAppointments", () => {
  const rows = [
    { id: "past", status: "scheduled", starts_at: "2026-11-16T12:00:00Z" },
    { id: "later", status: "scheduled", starts_at: "2026-11-20T12:00:00Z" },
    { id: "cancelled", status: "cancelled", starts_at: "2026-11-18T12:00:00Z" },
    { id: "soon", status: "scheduled", starts_at: "2026-11-18T09:00:00Z" },
    { id: "invalid", status: "scheduled", starts_at: "não é data" }
  ];

  it("mantém só consultas agendadas no futuro, em ordem", () => {
    expect(selectUpcomingAppointments(rows, { now }).map((r) => r.id)).toEqual(["soon", "later"]);
  });

  it("respeita o limite", () => {
    expect(selectUpcomingAppointments(rows, { now, limit: 1 }).map((r) => r.id)).toEqual(["soon"]);
  });

  it("aceita lista vazia ou ausente", () => {
    expect(selectUpcomingAppointments(undefined, { now })).toEqual([]);
  });
});

describe("safeMeetLink", () => {
  it("aceita link https do Meet", () => {
    expect(safeMeetLink("https://meet.google.com/abc-defg-hij")).toBe(
      "https://meet.google.com/abc-defg-hij"
    );
  });

  it("rejeita outros domínios, http e valores vazios", () => {
    expect(safeMeetLink("https://evil.example/meet.google.com")).toBeNull();
    expect(safeMeetLink("http://meet.google.com/abc")).toBeNull();
    expect(safeMeetLink("javascript:alert(1)")).toBeNull();
    expect(safeMeetLink("")).toBeNull();
    expect(safeMeetLink(null)).toBeNull();
  });
});
