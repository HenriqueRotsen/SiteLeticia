import { z } from "zod";
import { GOALS } from "@/lib/constants";
import { isValidCpf, normalizeCpf } from "@/lib/cpf-utils";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { isStrongPassword } from "@/lib/validation/password";

const strongPasswordSchema = z
  .string()
  .min(8, "Senha deve ter ao menos 8 caracteres.")
  .refine(isStrongPassword, {
    message:
      "Senha fraca. Use maiúscula, minúscula, número e caractere especial."
  });

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Nome inválido.")
      .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, {
        message: "Informe nome e sobrenome."
      }),
    email: z.string().trim().email("E-mail inválido."),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme a senha."),
    phone: z
      .string()
      .refine(isValidPhone, "WhatsApp inválido.")
      .transform(normalizePhone),
    cpf: z
      .string()
      .refine((value) => isValidCpf(value), "CPF inválido.")
      .transform(normalizeCpf),
    goal: z.enum(GOALS),
    consent: z.literal(true, {
      errorMap: () => ({ message: "É necessário aceitar a política de privacidade." })
    })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido.")
});

export const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme a nova senha.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"]
  });

export const appointmentCreateSchema = z.object({
  startsAt: z.string().datetime(),
  type: z.enum(["consultation", "return"]).default("consultation")
});

export const paymentSettingsSchema = z.object({
  consultationPriceCents: z.number().int().min(0),
  returnPriceCents: z.number().int().min(0).nullable().optional(),
  instructions: z.string().max(2000).optional(),
  cancellationPolicy: z.string().max(2000).optional()
});

export const paymentMethodSchema = z.object({
  type: z.enum(["pix", "transfer", "card_in_person", "cash", "other"]),
  label: z.string().min(1).max(100),
  details: z.record(z.string()).default({}),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

export const availabilityRuleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  active: z.boolean().default(true)
});

export const labReportPatchSchema = z.object({
  reportId: z.string().uuid().or(z.string().min(1)),
  status: z.enum(["draft", "published"]).optional(),
  interpretationSummary: z.string().max(10000).optional(),
  publishedBy: z.enum(["patient", "nutritionist"]).optional()
});

export const availabilityBlockSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  reason: z.string().max(500).optional()
});

export const dietSupplementSchema = z.object({
  productName: z.string().min(1),
  dosage: z.string().min(1),
  posology: z.string().min(1),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  groupId: z.string().optional().nullable(),
  groupTitle: z.string().optional().nullable()
});

export const dietReferralSchema = z.object({
  specialty: z.string().min(1),
  professionalName: z.string().optional().nullable(),
  reason: z.string().min(1),
  urgency: z.enum(["routine", "priority"]).default("routine"),
  bodyText: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0)
});

export const dietExamItemSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["principal", "complementary"]).default("principal"),
  whenToRequest: z.string().optional().nullable()
});

export const dietExamOrderSchema = z.object({
  title: z.string().min(1).default("Pedido de exames"),
  exams: z.array(dietExamItemSchema).default([]),
  collectionNotes: z.array(z.string()).default([]),
  observations: z.string().optional().nullable(),
  meta: z.record(z.any()).optional().nullable(),
  sortOrder: z.number().int().default(0)
});

export const dietPlanSchema = z.object({
  title: z.string().min(1),
  notes: z.string().optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).default("active"),
  source: z.enum(["manual", "fatsecret_csv", "fatsecret_pdf"]).default("manual"),
  sourcePdfPath: z.string().optional().nullable(),
  extractionSummary: z.string().optional().nullable(),
  extractionMethod: z.string().optional().nullable(),
  meals: z
    .array(
      z.object({
        name: z.string(),
        sortOrder: z.number().int().default(0),
        items: z
          .array(
            z.object({
              source: z.enum([
                "taco",
                "tbca",
                "usda",
                "off",
                "fatsecret",
                "fatsecret_csv",
                "fatsecret_pdf",
                "custom"
              ]),
              externalId: z.string().nullable().optional(),
              label: z.string(),
              quantity: z.number().positive(),
              portionG: z.number().positive(),
              nutritionSnapshot: z.record(z.any()).optional().nullable()
            })
          )
          .default([])
      })
    )
    .default([]),
  supplements: z.array(dietSupplementSchema).default([]),
  referrals: z.array(dietReferralSchema).default([]),
  examOrders: z.array(dietExamOrderSchema).default([])
});

export const bodyMeasurementSchema = z.object({
  weightKg: z.number().positive().optional(),
  waistCm: z.number().positive().optional(),
  hipCm: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
  recordedAt: z.string().datetime().optional()
});

export const patientStubSchema = z.object({
  cpf: z.string().refine(isValidCpf, "CPF inválido.").transform(normalizeCpf),
  fullName: z.string().min(2),
  phone: z.string().min(10),
  goal: z.enum(GOALS)
});

export const patientAnthropometricsSchema = z.object({
  sex: z.enum(["male", "female"]).nullable().optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .nullable()
    .optional(),
  heightCm: z.number().positive().max(300).nullable().optional(),
  weightKg: z.number().positive().max(500).nullable().optional(),
  bodyFatPercent: z.number().min(3).max(70).nullable().optional(),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "heavy", "very_heavy"])
    .optional(),
  bmrFormula: z
    .enum(["mifflin", "harris", "fao_who", "katch"])
    .optional()
});

export const patientProfileUpdateSchema = z.object({
  fullName: z.string().min(2, "Nome inválido.").optional(),
  phone: z.string().min(10, "WhatsApp inválido.").optional(),
  goal: z.enum(GOALS).optional(),
  sex: z.enum(["male", "female"]).nullable().optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .nullable()
    .optional(),
  heightCm: z.number().positive().max(300).nullable().optional(),
  weightKg: z.number().positive().max(500).nullable().optional(),
  bodyFatPercent: z.number().min(3).max(70).nullable().optional(),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "heavy", "very_heavy"])
    .optional(),
  addressStreet: z.string().max(200).nullable().optional(),
  addressNumber: z.string().max(20).nullable().optional(),
  addressComplement: z.string().max(100).nullable().optional(),
  addressNeighborhood: z.string().max(100).nullable().optional(),
  addressCity: z.string().max(100).nullable().optional(),
  addressState: z.string().max(2).nullable().optional(),
  addressZip: z.string().max(9).nullable().optional()
});
