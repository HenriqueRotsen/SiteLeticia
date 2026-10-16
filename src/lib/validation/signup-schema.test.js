import { describe, expect, it } from "vitest";
import { signupSchema } from "@/lib/validation/schemas";
import { GOALS } from "@/lib/constants";

const base = {
  fullName: "Maria Silva",
  email: "maria@example.com",
  password: "Senha@123",
  confirmPassword: "Senha@123",
  phone: "(11) 98765-4321",
  cpf: "529.982.247-25",
  goal: GOALS[0],
  consent: true
};

describe("signup schema", () => {
  it("accepts valid payload and normalizes phone/cpf", () => {
    const result = signupSchema.safeParse(base);
    expect(result.success).toBe(true);
    expect(result.data.phone).toBe("11987654321");
    expect(result.data.cpf).toBe("52998224725");
  });

  it("rejects invalid cpf", () => {
    const result = signupSchema.safeParse({ ...base, cpf: "111.111.111-11" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/CPF/i);
  });

  it("rejects weak password", () => {
    const result = signupSchema.safeParse({
      ...base,
      password: "senha123",
      confirmPassword: "senha123"
    });
    expect(result.success).toBe(false);
  });

  it("rejects password mismatch", () => {
    const result = signupSchema.safeParse({ ...base, confirmPassword: "Senha@124" });
    expect(result.success).toBe(false);
    expect(result.error.issues.some((i) => i.message.includes("coincidem"))).toBe(true);
  });
});
