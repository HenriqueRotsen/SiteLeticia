import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFY_TEMPLATE,
  clampBatchSize,
  nextInLine,
  outOfOrderIds,
  renderNotifyMessage,
  waitlistWhatsappLink
} from "@/lib/waitlist/notify";

const entries = [
  { id: 30, status: "waiting" },
  { id: 7, status: "waiting" },
  { id: 12, status: "called" },
  { id: 18, status: "waiting" },
  { id: 25, status: "waiting" }
];

describe("nextInLine", () => {
  it("takes the next waiting people in signup order", () => {
    expect(nextInLine(entries, 2).map((e) => e.id)).toEqual([7, 18]);
  });
});

describe("outOfOrderIds", () => {
  it("allows people inside the batch window", () => {
    expect(outOfOrderIds(entries, [18], 2)).toEqual([]);
  });

  it("blocks people further back in the queue", () => {
    expect(outOfOrderIds(entries, [30], 2)).toEqual([30]);
    expect(outOfOrderIds(entries, [12], 5)).toEqual([12]);
  });
});

describe("renderNotifyMessage", () => {
  it("fills the placeholders", () => {
    const text = renderNotifyMessage("Oi {primeiro_nome} ({nome}), você era {posicao}. {link}", {
      fullName: "VALCILENE carvalho",
      position: 10,
      link: "https://site/criar-conta"
    });
    expect(text).toBe("Oi Valcilene (VALCILENE carvalho), você era 10º. https://site/criar-conta");
  });

  it("uses the default template", () => {
    expect(renderNotifyMessage("", { fullName: "Ana", link: "L" })).toContain("Olá, Ana!");
    expect(DEFAULT_NOTIFY_TEMPLATE).toContain("{link}");
  });
});

describe("waitlistWhatsappLink", () => {
  it("adds the Brazil code once", () => {
    expect(waitlistWhatsappLink("61991774192", "oi")).toBe("https://wa.me/5561991774192?text=oi");
    expect(waitlistWhatsappLink("5561991774192", "oi")).toBe("https://wa.me/5561991774192?text=oi");
    expect(waitlistWhatsappLink("", "oi")).toBeNull();
  });
});

describe("clampBatchSize", () => {
  it("keeps the batch between 1 and 30", () => {
    expect(clampBatchSize("0")).toBe(5);
    expect(clampBatchSize(8)).toBe(8);
    expect(clampBatchSize(500)).toBe(30);
  });
});
