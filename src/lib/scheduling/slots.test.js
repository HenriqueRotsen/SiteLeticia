import { describe, expect, it } from "vitest";
import { generateSlotsFromRules } from "@/lib/scheduling/slots";
import { getWeekdayInTimezone, zonedTimeToUtc } from "@/lib/scheduling/timezone";
import { TIMEZONE } from "@/lib/constants";

describe("timezone-aware slots", () => {
  it("maps Monday wall time in Sao Paulo correctly", () => {
    // 2026-10-19 is a Monday
    const mondayNine = zonedTimeToUtc(
      { year: 2026, month: 10, day: 19, hour: 9, minute: 0 },
      TIMEZONE
    );
    expect(getWeekdayInTimezone(mondayNine, TIMEZONE)).toBe(1);
    expect(
      mondayNine.toLocaleTimeString("pt-BR", {
        timeZone: TIMEZONE,
        hour: "2-digit",
        minute: "2-digit"
      })
    ).toBe("09:00");
  });

  it("generates Monday 09:00–17:00 slots in America/Sao_Paulo, not UTC drift", () => {
    const from = zonedTimeToUtc({ year: 2026, month: 10, day: 19, hour: 0, minute: 0 }, TIMEZONE);
    const to = zonedTimeToUtc({ year: 2026, month: 10, day: 26, hour: 23, minute: 59 }, TIMEZONE);

    const slots = generateSlotsFromRules({
      from,
      to,
      rules: [{ weekday: 1, start_time: "09:00:00", end_time: "17:00:00", active: true }]
    });

    expect(slots.length).toBeGreaterThan(0);

    for (const slot of slots) {
      const start = new Date(slot.startsAt);
      expect(getWeekdayInTimezone(start, TIMEZONE)).toBe(1);
      const label = start.toLocaleDateString("pt-BR", {
        timeZone: TIMEZONE,
        weekday: "long"
      });
      expect(label.toLowerCase()).toContain("segunda");
      const time = start.toLocaleTimeString("pt-BR", {
        timeZone: TIMEZONE,
        hour: "2-digit",
        minute: "2-digit"
      });
      expect(time >= "09:00").toBe(true);
      expect(time <= "16:00").toBe(true);
    }

    const firstMonday = slots.filter((slot) => {
      const key = new Date(slot.startsAt).toLocaleDateString("en-CA", { timeZone: TIMEZONE });
      return key === "2026-10-19";
    });
    const times = firstMonday.map((slot) =>
      new Date(slot.startsAt).toLocaleTimeString("pt-BR", {
        timeZone: TIMEZONE,
        hour: "2-digit",
        minute: "2-digit"
      })
    );
    expect(times).toEqual(["09:00", "10:15", "11:30", "12:45", "14:00", "15:15"]);
  });
});
