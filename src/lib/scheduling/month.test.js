import { describe, expect, it } from "vitest";
import {
  addMonths,
  blockedDayKeys,
  dayRangeIso,
  formatDayKey,
  monthGrid,
  monthKeyOf,
  monthRangeIso,
  monthTitle
} from "@/lib/scheduling/month";

describe("month keys", () => {
  it("moves across years", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2027-01", -1)).toBe("2026-12");
    expect(addMonths("2026-11", 14)).toBe("2028-01");
  });

  it("uses the clinic time zone", () => {
    // 31/12 às 23h em São Paulo já é 01/01 em UTC.
    expect(monthKeyOf("2027-01-01T02:00:00Z")).toBe("2026-12");
  });

  it("titles in Portuguese", () => {
    expect(monthTitle("2027-01")).toBe("Janeiro de 2027");
  });
});

describe("monthGrid", () => {
  it("starts weeks on Sunday", () => {
    const weeks = monthGrid("2027-01"); // 01/01/2027 é sexta
    expect(weeks[0]).toEqual([null, null, null, null, null, "2027-01-01", "2027-01-02"]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });
});

describe("ranges", () => {
  it("covers whole days in São Paulo", () => {
    expect(dayRangeIso("2026-12-01", "2027-01-19")).toEqual({
      startsAt: "2026-12-01T03:00:00.000Z",
      endsAt: "2027-01-20T03:00:00.000Z"
    });
    expect(monthRangeIso("2027-02").endsAt).toBe("2027-03-01T03:00:00.000Z");
  });
});

describe("blockedDayKeys", () => {
  it("lists every blocked day", () => {
    const keys = blockedDayKeys([dayRangeIsoBlock("2027-01-18", "2027-01-19")]);
    expect([...keys].sort()).toEqual(["2027-01-18", "2027-01-19"]);
  });
});

function dayRangeIsoBlock(from, to) {
  const { startsAt, endsAt } = dayRangeIso(from, to);
  return { starts_at: startsAt, ends_at: endsAt };
}

describe("formatDayKey", () => {
  it("formats without time zone drift", () => {
    expect(formatDayKey("2027-01-20")).toBe("20/01/2027");
  });
});
