"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarClock,
  ClipboardList,
  FileSpreadsheet,
  FlaskConical,
  Phone,
  Scale,
  Target,
  UserRound
} from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import Badge, { appointmentBadge } from "@/components/ui/Badge";
import { Card, btnPrimary, btnSecondary } from "@/components/layout/AppShell";
import { labelDietStatus } from "@/lib/labels";

function formatPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone || "—";
}

function whatsappHref(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function dietBadgeVariant(status) {
  if (status === "active") return "success";
  if (status === "draft") return "warning";
  return "neutral";
}

function appointmentTypeLabel(type) {
  if (type === "return") return "Retorno";
  return "Consulta";
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <Icon className="h-7 w-7 text-graphite/20" strokeWidth={1.5} />
      <p className="mt-2 text-sm text-graphite/45">{message}</p>
    </div>
  );
}

export default function AdminPatientDetailPage() {
  const params = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/patients/${params.id}`).then((r) => r.json()),
      fetch(`/api/admin/appointments?patientId=${params.id}`).then((r) => r.json()),
      fetch(`/api/patients/${params.id}/diet`).then((r) => r.json())
    ])
      .then(([patientData, appointmentsData, dietData]) => {
        setPatient(patientData.patient || null);
        setAppointments(appointmentsData.appointments || []);
        setDietPlans(dietData.dietPlans || []);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const upcomingList = [];
    const pastList = [];

    for (const appt of appointments) {
      const starts = new Date(appt.starts_at).getTime();
      const isUpcoming = starts >= now && appt.status === "scheduled";
      if (isUpcoming) upcomingList.push(appt);
      else pastList.push(appt);
    }

    upcomingList.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    pastList.sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));

    return { upcoming: upcomingList, past: pastList };
  }, [appointments]);

  if (loading || !patient) {
    return (
      <AdminShell title="Paciente" breadcrumbs={["Admin", "Pacientes"]} userName="Letícia">
        <p className="text-sm text-graphite/55">Carregando prontuário...</p>
      </AdminShell>
    );
  }

  const activePlan = dietPlans.find((plan) => plan.status === "active");

  return (
    <AdminShell
      title={patient.full_name}
      breadcrumbs={["Admin", "Pacientes", patient.full_name]}
      userName="Letícia"
    >
      <section className="overflow-hidden rounded-3xl border border-olive-900/10 bg-gradient-to-br from-olive-50 via-porcelain to-linen shadow-card">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-olive-700 text-white shadow-sm">
                <UserRound className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold text-graphite">{patient.full_name}</h1>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {patient.from_waitlist ? <Badge variant="warning">Fila de espera</Badge> : null}
                  {!patient.has_account ? (
                    <Badge variant="neutral">Sem conta</Badge>
                  ) : (
                    <Badge variant="success">Conta ativa</Badge>
                  )}
                  {activePlan ? <Badge variant="info">Plano ativo</Badge> : null}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white/70 px-3.5 py-3 ring-1 ring-olive-900/8">
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-graphite/40">
                  <Phone className="h-3.5 w-3.5" /> WhatsApp
                </p>
                {whatsappHref(patient.phone) ? (
                  <a
                    href={whatsappHref(patient.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm font-semibold text-olive-800 underline-offset-2 transition hover:text-olive-900 hover:underline"
                  >
                    {formatPhone(patient.phone)}
                  </a>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-graphite">—</p>
                )}
              </div>
              <div className="rounded-2xl bg-white/70 px-3.5 py-3 ring-1 ring-olive-900/8">
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-graphite/40">
                  <Target className="h-3.5 w-3.5" /> Objetivo
                </p>
                <p className="mt-1 text-sm font-semibold text-graphite">{patient.goal || "—"}</p>
              </div>
              <div className="rounded-2xl bg-white/70 px-3.5 py-3 ring-1 ring-olive-900/8">
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-graphite/40">
                  <Scale className="h-3.5 w-3.5" /> Peso
                </p>
                <p className="mt-1 text-sm font-semibold text-graphite">
                  {patient.latest_weight_kg != null ? `${patient.latest_weight_kg} kg` : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 px-3.5 py-3 ring-1 ring-olive-900/8">
                <p className="text-[11px] font-medium uppercase tracking-wide text-graphite/40">CPF</p>
                <p className="mt-1 text-sm font-semibold text-graphite">{patient.cpf_masked || "—"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/pacientes/${params.id}/dieta?new=1`} className={btnPrimary()}>
              <ClipboardList className="h-4 w-4" strokeWidth={1.75} />
              Nova prescrição
            </Link>
            <Link href={`/admin/pacientes/${params.id}/exames`} className={btnSecondary()}>
              <FlaskConical className="h-4 w-4" strokeWidth={1.75} />
              Exames
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden p-0 sm:p-0">
          <div className="flex items-center justify-between border-b border-olive-900/10 bg-gradient-to-r from-sky-50/80 to-porcelain px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <CalendarClock className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="font-semibold text-graphite">Consultas</h2>
                <p className="text-xs text-graphite/45">
                  {upcoming.length} futuras · {past.length} passadas
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700/70">
                Futuras
              </p>
              {upcoming.length ? (
                <ul className="space-y-2">
                  {upcoming.map((appt) => {
                    const badge = appointmentBadge(appt.status);
                    return (
                      <li
                        key={appt.id}
                        className="rounded-2xl border border-sky-100 bg-sky-50/40 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-graphite">
                              {formatDateTime(appt.starts_at)}
                            </p>
                            <p className="mt-0.5 text-xs text-graphite/50">
                              {appointmentTypeLabel(appt.type)}
                            </p>
                          </div>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState icon={CalendarClock} message="Nenhuma consulta futura" />
              )}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-graphite/40">
                Passadas
              </p>
              {past.length ? (
                <ul className="space-y-2">
                  {past.slice(0, 8).map((appt) => {
                    const badge = appointmentBadge(appt.status);
                    return (
                      <li
                        key={appt.id}
                        className="rounded-2xl border border-olive-900/8 bg-white px-4 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-graphite">
                              {formatDateTime(appt.starts_at)}
                            </p>
                            <p className="mt-0.5 text-xs text-graphite/45">
                              {appointmentTypeLabel(appt.type)}
                            </p>
                          </div>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState icon={CalendarClock} message="Nenhuma consulta passada" />
              )}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden p-0 sm:p-0">
          <div className="flex items-center justify-between border-b border-olive-900/10 bg-gradient-to-r from-violet-50/80 to-porcelain px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <FileSpreadsheet className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="font-semibold text-graphite">Planos alimentares</h2>
                <p className="text-xs text-graphite/45">
                  {dietPlans.length} {dietPlans.length === 1 ? "plano" : "planos"}
                </p>
              </div>
            </div>
            <Link
              href={`/admin/pacientes/${params.id}/dieta?new=1`}
              className="text-xs font-semibold text-olive-700 hover:text-olive-800"
            >
              Novo →
            </Link>
          </div>

          <div className="p-5">
            {dietPlans.length ? (
              <ul className="space-y-2.5">
                {dietPlans.map((plan) => {
                  const mealCount = (plan.diet_meals || []).length;
                  const supplementCount = (plan.diet_supplements || []).length;
                  const referralCount = (plan.diet_referrals || []).length;

                  return (
                    <li key={plan.id}>
                      <Link
                        href={`/admin/pacientes/${params.id}/dieta?planId=${plan.id}`}
                        className={`block rounded-2xl border px-4 py-3 transition hover:border-olive-300 hover:bg-olive-50/40 ${
                          plan.status === "active"
                            ? "border-olive-300 bg-olive-50/50 ring-1 ring-olive-200/60"
                            : "border-olive-900/8 bg-white"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-graphite">
                              {plan.title || "Plano alimentar"}
                            </p>
                            <p className="mt-0.5 text-xs text-graphite/45">
                              {formatDate(plan.created_at)}
                              {mealCount ? ` · ${mealCount} refeições` : ""}
                              {supplementCount ? ` · ${supplementCount} suplementos` : ""}
                              {referralCount ? ` · ${referralCount} encaminh.` : ""}
                            </p>
                          </div>
                          <Badge variant={dietBadgeVariant(plan.status)}>
                            {labelDietStatus(plan.status)}
                          </Badge>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={FileSpreadsheet} message="Nenhum plano publicado ainda" />
            )}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
