"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PatientShell from "@/components/layout/PatientShell";
import { btnPrimary, Card, inputClassName } from "@/components/layout/AppShell";
import { GOALS } from "@/lib/constants";
import { ACTIVITY_LEVELS } from "@/lib/metabolism/bmr";
import { resetPatientProfileCache } from "@/lib/hooks/usePatientProfile";

const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO"
];

function formatPhoneDisplay(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function formatZipDisplay(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

function normalizeBirthDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function readFormFromPatient(patient, profile) {
  return {
    fullName: patient?.full_name || profile?.full_name || "",
    email: profile?.email || "",
    cpfMasked: patient?.cpf_masked || "Pendente",
    phone: formatPhoneDisplay(patient?.phone),
    goal: patient?.goal || GOALS[0],
    sex: patient?.sex || "",
    birthDate: normalizeBirthDate(patient?.birth_date),
    heightCm: patient?.height_cm != null ? String(patient.height_cm) : "",
    weightKg: patient?.latest_weight_kg != null ? String(patient.latest_weight_kg) : "",
    bodyFatPercent:
      patient?.body_fat_percent != null ? String(patient.body_fat_percent) : "",
    activityLevel: patient?.activity_level || "sedentary",
    addressStreet: patient?.address_street || "",
    addressNumber: patient?.address_number || "",
    addressComplement: patient?.address_complement || "",
    addressNeighborhood: patient?.address_neighborhood || "",
    addressCity: patient?.address_city || "",
    addressState: patient?.address_state || "",
    addressZip: formatZipDisplay(patient?.address_zip)
  };
}

function FieldLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-graphite/70">
      {children}
    </label>
  );
}

function ReadonlyField({ label, value }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className={`${inputClassName()} bg-porcelain/60 text-graphite/70`}>{value || "—"}</div>
    </div>
  );
}

export default function PerfilPage() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("neutral");

  useEffect(() => {
    fetch("/api/patients/me")
      .then((response) => response.json())
      .then((data) => {
        setForm(readFormFromPatient(data.patient, data.profile));
      })
      .catch(() => {
        setFeedbackTone("error");
        setFeedback("Não foi possível carregar seu perfil.");
      })
      .finally(() => setLoading(false));
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFeedback("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form) return;

    setSaving(true);
    setFeedback("");

    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone,
      goal: form.goal,
      sex: form.sex || null,
      birthDate: form.birthDate || null,
      heightCm: form.heightCm ? Number(form.heightCm) : null,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      bodyFatPercent: form.bodyFatPercent ? Number(form.bodyFatPercent) : null,
      activityLevel: form.activityLevel,
      addressStreet: form.addressStreet.trim() || null,
      addressNumber: form.addressNumber.trim() || null,
      addressComplement: form.addressComplement.trim() || null,
      addressNeighborhood: form.addressNeighborhood.trim() || null,
      addressCity: form.addressCity.trim() || null,
      addressState: form.addressState.trim() || null,
      addressZip: form.addressZip.replace(/\D/g, "") || null
    };

    const response = await fetch("/api/patients/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setFeedbackTone("error");
      setFeedback(data.message || "Erro ao salvar perfil.");
      return;
    }

    resetPatientProfileCache();
    setForm(readFormFromPatient(data.patient, data.profile));
    setFeedbackTone("success");
    setFeedback("Perfil atualizado com sucesso.");
  }

  return (
    <PatientShell
      title="Meu perfil"
      subtitle="Seus dados pessoais e de contato"
      breadcrumbs={["Paciente", "Perfil"]}
    >
      {loading ? (
        <Card>
          <p className="py-8 text-center text-sm text-graphite/45">Carregando perfil...</p>
        </Card>
      ) : !form ? (
        <Card>
          <p className="py-8 text-center text-sm text-red-700/80">{feedback || "Perfil indisponível."}</p>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card title="Identificação">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="fullName">Nome completo</FieldLabel>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  className={inputClassName()}
                />
              </div>
              <ReadonlyField label="CPF" value={form.cpfMasked} />
              <ReadonlyField label="E-mail" value={form.email} />
              <div>
                <FieldLabel htmlFor="phone">WhatsApp</FieldLabel>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(event) => updateField("phone", formatPhoneDisplay(event.target.value))}
                  className={inputClassName()}
                  placeholder="(31) 99999-9999"
                />
              </div>
              <div>
                <FieldLabel htmlFor="goal">Objetivo do acompanhamento</FieldLabel>
                <select
                  id="goal"
                  value={form.goal}
                  onChange={(event) => updateField("goal", event.target.value)}
                  className={inputClassName()}
                >
                  {GOALS.map((goal) => (
                    <option key={goal} value={goal}>
                      {goal}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card title="Dados pessoais e antropometria">
            <p className="mb-4 text-sm text-graphite/55">
              Esses dados ajudam no cálculo de metabolismo e no acompanhamento nutricional. Ao
              alterar o peso, uma nova medição é registrada na{" "}
              <Link href="/app/evolucao" className="font-medium text-olive-800 underline-offset-2 hover:underline">
                evolução
              </Link>
              .
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel htmlFor="birthDate">Data de nascimento</FieldLabel>
                <input
                  id="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={(event) => updateField("birthDate", event.target.value)}
                  className={inputClassName()}
                />
              </div>
              <div>
                <FieldLabel htmlFor="sex">Sexo</FieldLabel>
                <select
                  id="sex"
                  value={form.sex}
                  onChange={(event) => updateField("sex", event.target.value)}
                  className={inputClassName()}
                >
                  <option value="">Selecione</option>
                  <option value="female">Feminino</option>
                  <option value="male">Masculino</option>
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="heightCm">Altura (cm)</FieldLabel>
                <input
                  id="heightCm"
                  type="number"
                  min="50"
                  max="250"
                  step="0.1"
                  value={form.heightCm}
                  onChange={(event) => updateField("heightCm", event.target.value)}
                  className={inputClassName()}
                  placeholder="165"
                />
              </div>
              <div>
                <FieldLabel htmlFor="weightKg">Peso atual (kg)</FieldLabel>
                <input
                  id="weightKg"
                  type="number"
                  min="20"
                  max="300"
                  step="0.1"
                  value={form.weightKg}
                  onChange={(event) => updateField("weightKg", event.target.value)}
                  className={inputClassName()}
                  placeholder="65"
                />
              </div>
              <div>
                <FieldLabel htmlFor="bodyFatPercent">% gordura corporal (opcional)</FieldLabel>
                <input
                  id="bodyFatPercent"
                  type="number"
                  min="3"
                  max="70"
                  step="0.1"
                  value={form.bodyFatPercent}
                  onChange={(event) => updateField("bodyFatPercent", event.target.value)}
                  className={inputClassName()}
                  placeholder="25"
                />
              </div>
              <div>
                <FieldLabel htmlFor="activityLevel">Nível de atividade</FieldLabel>
                <select
                  id="activityLevel"
                  value={form.activityLevel}
                  onChange={(event) => updateField("activityLevel", event.target.value)}
                  className={inputClassName()}
                >
                  {Object.entries(ACTIVITY_LEVELS).map(([key, level]) => (
                    <option key={key} value={key}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card title="Endereço">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-2">
                <FieldLabel htmlFor="addressStreet">Logradouro</FieldLabel>
                <input
                  id="addressStreet"
                  type="text"
                  value={form.addressStreet}
                  onChange={(event) => updateField("addressStreet", event.target.value)}
                  className={inputClassName()}
                  placeholder="Rua, avenida..."
                />
              </div>
              <div>
                <FieldLabel htmlFor="addressNumber">Número</FieldLabel>
                <input
                  id="addressNumber"
                  type="text"
                  value={form.addressNumber}
                  onChange={(event) => updateField("addressNumber", event.target.value)}
                  className={inputClassName()}
                  placeholder="123"
                />
              </div>
              <div>
                <FieldLabel htmlFor="addressComplement">Complemento</FieldLabel>
                <input
                  id="addressComplement"
                  type="text"
                  value={form.addressComplement}
                  onChange={(event) => updateField("addressComplement", event.target.value)}
                  className={inputClassName()}
                  placeholder="Apto, bloco..."
                />
              </div>
              <div>
                <FieldLabel htmlFor="addressNeighborhood">Bairro</FieldLabel>
                <input
                  id="addressNeighborhood"
                  type="text"
                  value={form.addressNeighborhood}
                  onChange={(event) => updateField("addressNeighborhood", event.target.value)}
                  className={inputClassName()}
                />
              </div>
              <div>
                <FieldLabel htmlFor="addressCity">Cidade</FieldLabel>
                <input
                  id="addressCity"
                  type="text"
                  value={form.addressCity}
                  onChange={(event) => updateField("addressCity", event.target.value)}
                  className={inputClassName()}
                />
              </div>
              <div>
                <FieldLabel htmlFor="addressState">Estado</FieldLabel>
                <select
                  id="addressState"
                  value={form.addressState}
                  onChange={(event) => updateField("addressState", event.target.value)}
                  className={inputClassName()}
                >
                  <option value="">Selecione</option>
                  {BRAZILIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="addressZip">CEP</FieldLabel>
                <input
                  id="addressZip"
                  type="text"
                  inputMode="numeric"
                  value={form.addressZip}
                  onChange={(event) => updateField("addressZip", formatZipDisplay(event.target.value))}
                  className={inputClassName()}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving} className={btnPrimary()}>
              {saving ? "Salvando..." : "Salvar perfil"}
            </button>
            {feedback ? (
              <p
                className={`text-sm ${
                  feedbackTone === "error"
                    ? "text-red-700"
                    : feedbackTone === "success"
                      ? "text-olive-800"
                      : "text-graphite/60"
                }`}
              >
                {feedback}
              </p>
            ) : null}
          </div>
        </form>
      )}
    </PatientShell>
  );
}
