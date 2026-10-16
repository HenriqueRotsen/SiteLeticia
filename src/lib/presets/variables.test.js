import { describe, expect, it } from "vitest";
import {
  extractVariableKeys,
  fillVariables,
  formatVariableToken,
  normalizeLegacyPlaceholders
} from "@/lib/presets/variables";

describe("preset variables", () => {
  it("formats and extracts {{keys}}", () => {
    expect(formatVariableToken("Paciente")).toBe("{{paciente}}");
    expect(extractVariableKeys("Olá {{paciente}} — exame em {{data}}")).toEqual([
      "paciente",
      "data"
    ]);
  });

  it("normalizes legacy brackets used nos PDFs", () => {
    expect(normalizeLegacyPlaceholders("Avaliação de [PACIENTE]")).toBe(
      "Avaliação de {{paciente}}"
    );
    expect(normalizeLegacyPlaceholders("CRN: [número]")).toBe("CRN: {{crn}}");
  });

  it("fills values across nested content", () => {
    const filled = fillVariables(
      {
        observations: "Paciente: {{paciente}}",
        collectionNotes: ["Data: {{data_solicitacao}}"]
      },
      { paciente: "Ana", data_solicitacao: "12/10/2026" }
    );
    expect(filled.observations).toBe("Paciente: Ana");
    expect(filled.collectionNotes[0]).toBe("Data: 12/10/2026");
  });
});
