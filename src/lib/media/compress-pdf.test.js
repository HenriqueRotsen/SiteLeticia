import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { compressPdfBuffer } from "@/lib/media/compress-pdf";

describe("compressPdfBuffer", () => {
  it("retorna um PDF válido e não aumenta o tamanho desnecessariamente", async () => {
    const document = await PDFDocument.create();
    const page = document.addPage();
    const font = await document.embedFont(StandardFonts.Helvetica);
    page.drawText("Hemograma completo - teste", { x: 50, y: 700, size: 12, font });
    const original = Buffer.from(await document.save());

    const result = await compressPdfBuffer(original);

    expect(result.buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(result.compressedBytes).toBeLessThanOrEqual(result.originalBytes);
  });
});
