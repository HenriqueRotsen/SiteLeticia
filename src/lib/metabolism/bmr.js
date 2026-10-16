export const BMR_FORMULAS = {
  MIFFLIN_ST_JEOR: "mifflin",
  HARRIS_BENEDICT: "harris",
  FAO_WHO: "fao_who",
  KATCH_MCARDLE: "katch"
};

export const BMR_FORMULA_LABELS = {
  [BMR_FORMULAS.MIFFLIN_ST_JEOR]: "Mifflin-St Jeor (1990)",
  [BMR_FORMULAS.HARRIS_BENEDICT]: "Harris-Benedict revisada (1984)",
  [BMR_FORMULAS.FAO_WHO]: "FAO/WHO/UNU (2001)",
  [BMR_FORMULAS.KATCH_MCARDLE]: "Katch-McArdle (requer % gordura)"
};

export const ACTIVITY_LEVELS = {
  sedentary: { label: "Sedentário", factor: 1.2 },
  light: { label: "Levemente ativo", factor: 1.375 },
  moderate: { label: "Moderadamente ativo", factor: 1.55 },
  heavy: { label: "Muito ativo", factor: 1.725 },
  very_heavy: { label: "Extremamente ativo", factor: 1.9 }
};

export function ageFromBirthDate(birthDate, referenceDate = new Date()) {
  if (!birthDate) return null;

  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  let age = ref.getFullYear() - birth.getFullYear();
  const monthDiff = ref.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function computeTmbMifflinStJeor({ sex, weightKg, heightCm, ageYears }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === "male" ? base + 5 : base - 161;
}

export function computeTmbHarrisBenedict({ sex, weightKg, heightCm, ageYears }) {
  if (sex === "male") {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears;
  }

  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears;
}

export function computeTmbFaoWho({ sex, weightKg, ageYears }) {
  if (ageYears >= 18 && ageYears < 30) {
    return sex === "male" ? 15.057 * weightKg + 692.2 : 14.818 * weightKg + 486.6;
  }

  if (ageYears >= 30 && ageYears < 60) {
    return sex === "male" ? 11.472 * weightKg + 873.1 : 8.126 * weightKg + 845.6;
  }

  if (ageYears >= 60) {
    return sex === "male" ? 11.711 * weightKg + 587.7 : 9.082 * weightKg + 658.5;
  }

  return null;
}

export function computeTmbKatchMcArdle({ weightKg, bodyFatPercent }) {
  const leanMassKg = weightKg * (1 - bodyFatPercent / 100);
  return 370 + 21.6 * leanMassKg;
}

export function computeTmb(formula, input) {
  switch (formula) {
    case BMR_FORMULAS.MIFFLIN_ST_JEOR:
      return computeTmbMifflinStJeor(input);
    case BMR_FORMULAS.HARRIS_BENEDICT:
      return computeTmbHarrisBenedict(input);
    case BMR_FORMULAS.FAO_WHO:
      return computeTmbFaoWho(input);
    case BMR_FORMULAS.KATCH_MCARDLE:
      return computeTmbKatchMcArdle(input);
    default:
      return null;
  }
}

export function computeGet(tmbKcal, activityLevel = "sedentary") {
  const level = ACTIVITY_LEVELS[activityLevel] || ACTIVITY_LEVELS.sedentary;
  return tmbKcal * level.factor;
}

function roundKcal(value) {
  return Math.round(Number(value));
}

export function computePatientMetabolism(input) {
  const missing = [];

  if (!input.sex || !["male", "female"].includes(input.sex)) {
    missing.push("sexo");
  }

  const weightKg = Number(input.weightKg);
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    missing.push("peso");
  }

  const heightCm = Number(input.heightCm);
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    missing.push("altura");
  }

  const ageYears =
    input.ageYears != null ? Number(input.ageYears) : ageFromBirthDate(input.birthDate);

  if (!Number.isFinite(ageYears) || ageYears < 10 || ageYears > 120) {
    missing.push("idade ou data de nascimento");
  }

  if (missing.length) {
    return { ok: false, missing };
  }

  const baseInput = {
    sex: input.sex,
    weightKg,
    heightCm,
    ageYears
  };

  const formulas = {};

  for (const [key, formula] of Object.entries(BMR_FORMULAS)) {
    if (formula === BMR_FORMULAS.KATCH_MCARDLE) continue;

    const raw = computeTmb(formula, baseInput);
    if (raw != null && Number.isFinite(raw)) {
      formulas[formula] = roundKcal(raw);
    }
  }

  const bodyFatPercent = Number(input.bodyFatPercent);
  if (Number.isFinite(bodyFatPercent) && bodyFatPercent >= 3 && bodyFatPercent <= 70) {
    const raw = computeTmbKatchMcArdle({ weightKg, bodyFatPercent });
    if (Number.isFinite(raw)) {
      formulas[BMR_FORMULAS.KATCH_MCARDLE] = roundKcal(raw);
    }
  }

  const requestedFormula = Object.values(BMR_FORMULAS).includes(input.primaryFormula)
    ? input.primaryFormula
    : BMR_FORMULAS.MIFFLIN_ST_JEOR;
  const primaryFormula =
    formulas[requestedFormula] != null
      ? requestedFormula
      : BMR_FORMULAS.MIFFLIN_ST_JEOR;
  const tmbKcal = formulas[primaryFormula] ?? null;

  const activityLevel = input.activityLevel || "sedentary";
  const getKcal = tmbKcal != null ? roundKcal(computeGet(tmbKcal, activityLevel)) : null;

  return {
    ok: true,
    ageYears,
    weightKg,
    heightCm,
    sex: input.sex,
    primaryFormula,
    tmbKcal,
    getKcal,
    activityLevel,
    formulas
  };
}

export function formatKcal(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${Math.round(value)} kcal`;
}
