import { NextResponse } from "next/server";
import { DEMO_ROLE_COOKIE } from "@/lib/demo/config";
import { getDemoNotifications } from "@/lib/demo/notifications";
import {
  createInitialDemoState,
  demoDietPlan,
  demoFoodResults,
  demoInsights,
  demoLabReport,
  demoMeasurements,
  demoPatient,
  demoPatientsList,
  getDemoPendingLabReports,
  generateDemoSlots,
  patientId
} from "@/lib/demo/data";

let state = createInitialDemoState();

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

export function resetDemoState() {
  state = createInitialDemoState();
}

export async function handleDemoApi(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === "/api/auth/login" && method === "POST") return json({ ok: true });
  if (path === "/api/auth/logout" && method === "POST") return json({ ok: true });
  if (path === "/api/auth/signup" && method === "POST") return json({ ok: true, patientId });
  if (path === "/api/auth/forgot-password" && method === "POST") {
    return json({
      ok: true,
      message:
        "Modo demo: e-mails de recuperação não são enviados. Use a senha de demonstração ou crie uma conta real."
    });
  }
  if (path === "/api/auth/reset-password" && method === "POST") {
    return json({
      ok: true,
      message: "Senha redefinida com sucesso. Faça login com a nova senha."
    });
  }

  if (path === "/api/appointments" && method === "GET") {
    return json({ appointments: state.appointments });
  }

  if (path === "/api/appointments" && method === "POST") {
    const body = await request.json();
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    const appt = {
      id: `appt-${Date.now()}`,
      patient_id: patientId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      duration_min: 60,
      buffer_min: 15,
      type: body.type || "consultation",
      status: "scheduled",
      payment_status: "pending",
      amount_cents: state.paymentSettings.consultation_price_cents,
      meet_link: state.googleConnected ? "https://meet.google.com/demo-nova-consulta" : null
    };
    state.appointments.push(appt);
    return json({ appointment: appt, calendarWarning: state.googleConnected ? null : "Modo demo: Meet simulado se Google conectado." });
  }

  if (path === "/api/appointments/slots" && method === "GET") {
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    return json({
      slots: generateDemoSlots(from, to),
      durationMin: 60,
      bufferMin: 15
    });
  }

  if (path === "/api/payment-info" && method === "GET") {
    return json({ settings: state.paymentSettings, methods: state.paymentMethods.filter((m) => m.active !== false) });
  }

  if (path === "/api/notifications" && method === "GET") {
    const role = request.cookies.get(DEMO_ROLE_COOKIE)?.value || "patient";
    return json({ notifications: getDemoNotifications(role) });
  }

  if (path === "/api/patients/me" && method === "GET") {
    return json({
      patient: state.patientProfile,
      profile: { email: "maria.demo@exemplo.com", full_name: state.patientProfile.full_name },
      waitlist: {
        found: true,
        status: "waiting",
        position: 12,
        message: "Essa posição considera apenas pacientes ainda aguardando atendimento."
      }
    });
  }

  if (path === "/api/patients/me" && method === "PATCH") {
    const body = await request.json();
    state.patientProfile = {
      ...state.patientProfile,
      full_name: body.fullName ?? state.patientProfile.full_name,
      phone: body.phone ? String(body.phone).replace(/\D/g, "") : state.patientProfile.phone,
      goal: body.goal ?? state.patientProfile.goal,
      sex: body.sex ?? state.patientProfile.sex,
      birth_date: body.birthDate ?? state.patientProfile.birth_date,
      height_cm: body.heightCm ?? state.patientProfile.height_cm,
      body_fat_percent:
        body.bodyFatPercent !== undefined
          ? body.bodyFatPercent
          : state.patientProfile.body_fat_percent,
      activity_level: body.activityLevel ?? state.patientProfile.activity_level,
      address_street: body.addressStreet ?? state.patientProfile.address_street,
      address_number: body.addressNumber ?? state.patientProfile.address_number,
      address_complement: body.addressComplement ?? state.patientProfile.address_complement,
      address_neighborhood: body.addressNeighborhood ?? state.patientProfile.address_neighborhood,
      address_city: body.addressCity ?? state.patientProfile.address_city,
      address_state: body.addressState ?? state.patientProfile.address_state,
      address_zip: body.addressZip ?? state.patientProfile.address_zip,
      latest_weight_kg: body.weightKg ?? state.patientProfile.latest_weight_kg,
      latest_weight_at: body.weightKg ? new Date().toISOString() : state.patientProfile.latest_weight_at
    };

    return json({
      patient: state.patientProfile,
      profile: { email: "maria.demo@exemplo.com", full_name: state.patientProfile.full_name },
      waitlist: {
        found: true,
        status: "waiting",
        position: 12,
        message: "Essa posição considera apenas pacientes ainda aguardando atendimento."
      }
    });
  }
  if (path === "/api/patients/me/diet" && method === "GET") return json({ dietPlan: demoDietPlan });
  if (path === "/api/patients/me/labs" && method === "GET") {
    const reports = state.labReports.filter((report) => report.patient_id === patientId);
    return json({
      reports: reports.filter((report) => report.status === "published" || report.uploaded_by === "patient")
    });
  }

  if (path === "/api/patients/me/labs" && method === "POST") {
    const aiText = demoLabReport.ai_interpretation;
    const report = {
      id: `lab-${Date.now()}`,
      patient_id: patientId,
      status: "draft",
      uploaded_by: "patient",
      published_by: null,
      created_at: new Date().toISOString(),
      ai_interpretation: aiText,
      interpretation_summary: aiText,
      lab_results: demoLabReport.lab_results
    };
    state.labReports.unshift(report);
    return json({ report, results: report.lab_results });
  }

  if (path === "/api/patients/me/labs" && method === "PATCH") {
    const body = await request.json();
    const report = state.labReports.find((item) => item.id === body.reportId && item.patient_id === patientId);
    if (!report) return json({ message: "Laudo não encontrado." }, { status: 404 });

    if (body.interpretationSummary != null) report.interpretation_summary = body.interpretationSummary;
    if (body.status === "published") {
      report.status = "published";
      report.published_by = "patient";
      report.reviewed_at = new Date().toISOString();
    }

    return json({ report });
  }

  if (path === "/api/patients/me/photos" && method === "GET") {
    return json({
      photos: state.photos.map((photo) => ({
        ...photo,
        url: photo.url || `https://picsum.photos/seed/${photo.id}/800/1000`
      }))
    });
  }
  if (path === "/api/patients/me/photos" && method === "POST") {
    const photo = {
      id: `photo-${Date.now()}`,
      taken_at: new Date().toISOString(),
      caption: "Foto demo",
      storage_path: "demo/photo.jpg",
      url: `https://picsum.photos/seed/${Date.now()}/800/1000`
    };
    state.photos.unshift(photo);
    return json({ photo });
  }
  if (path === "/api/patients/me/measurements" && method === "GET") {
    return json({ measurements: demoMeasurements });
  }
  if (path === "/api/patients/me/insights" && method === "GET") return json({ insights: demoInsights });

  if (path === "/api/admin/dashboard" && method === "GET") {
    return json({
      stats: {
        patients: demoPatientsList.length,
        appointmentsToday: 1,
        pendingLabs: getDemoPendingLabReports(state.labReports).length
      },
      upcoming: state.appointments
    });
  }

  if (path === "/api/admin/labs/pending" && method === "GET") {
    return json({ reports: getDemoPendingLabReports(state.labReports) });
  }

  if (path === "/api/admin/patients" && method === "GET") {
    return json({ patients: demoPatientsList });
  }

  if (path.match(/^\/api\/admin\/patients\/[^/]+$/) && method === "GET") {
    return json({ patient: demoPatient });
  }

  if (path.match(/^\/api\/admin\/patients\/[^/]+$/) && method === "PATCH") {
    const body = await request.json();
    if (body.sex !== undefined) demoPatient.sex = body.sex;
    if (body.birthDate !== undefined) demoPatient.birth_date = body.birthDate;
    if (body.heightCm !== undefined) demoPatient.height_cm = body.heightCm;
    if (body.bodyFatPercent !== undefined) demoPatient.body_fat_percent = body.bodyFatPercent;
    if (body.activityLevel !== undefined) demoPatient.activity_level = body.activityLevel;
    if (body.weightKg != null) {
      demoPatient.latest_weight_kg = body.weightKg;
      demoPatient.latest_weight_at = new Date().toISOString();
    }
    return json({ patient: demoPatient });
  }

  if (path === "/api/admin/appointments" && method === "GET") {
    return json({ appointments: state.appointments });
  }

  if (path.match(/^\/api\/admin\/appointments\/[^/]+\/payment$/) && method === "PATCH") {
    const id = path.split("/")[4];
    const body = await request.json();
    state.appointments = state.appointments.map((a) =>
      a.id === id ? { ...a, payment_status: body.paymentStatus } : a
    );
    const updated = state.appointments.find((a) => a.id === id);
    return json({ appointment: updated });
  }

  if (path === "/api/admin/availability" && method === "GET") {
    return json({ rules: state.availabilityRules, blocks: state.availabilityBlocks });
  }

  if (path === "/api/admin/availability" && method === "POST") {
    const body = await request.json();
    if (body.kind === "block") {
      const block = { id: `block-${Date.now()}`, starts_at: body.startsAt, ends_at: body.endsAt, reason: body.reason };
      state.availabilityBlocks.push(block);
      return json({ block });
    }
    const rule = {
      id: `rule-${Date.now()}`,
      weekday: body.weekday,
      start_time: `${body.startTime}:00`,
      end_time: `${body.endTime}:00`,
      active: true
    };
    state.availabilityRules.push(rule);
    return json({ rule });
  }

  if (path === "/api/admin/availability" && method === "DELETE") {
    const id = url.searchParams.get("id");
    state.availabilityRules = state.availabilityRules.filter((r) => r.id !== id);
    state.availabilityBlocks = state.availabilityBlocks.filter((b) => b.id !== id);
    return json({ ok: true });
  }

  if (path === "/api/admin/payment-settings" && method === "GET") {
    return json({ settings: state.paymentSettings });
  }

  if (path === "/api/admin/payment-settings" && method === "PUT") {
    const body = await request.json();
    state.paymentSettings = {
      ...state.paymentSettings,
      consultation_price_cents: body.consultationPriceCents,
      return_price_cents: body.returnPriceCents,
      instructions: body.instructions,
      cancellation_policy: body.cancellationPolicy
    };
    return json({ settings: state.paymentSettings });
  }

  if (path === "/api/admin/payment-methods" && method === "GET") {
    return json({ methods: state.paymentMethods });
  }

  if (path === "/api/admin/payment-methods" && method === "POST") {
    const body = await request.json();
    const methodRow = {
      id: `pm-${Date.now()}`,
      type: body.type,
      label: body.label,
      details: body.details || {},
      active: body.active ?? true,
      sort_order: body.sortOrder ?? 0
    };
    state.paymentMethods.push(methodRow);
    return json({ method: methodRow });
  }

  if (path === "/api/admin/integrations/google-calendar" && method === "GET") {
    return json({
      connected: state.googleConnected,
      connection: state.googleConnected ? { connected_at: new Date().toISOString(), calendar_id: "primary" } : null
    });
  }

  if (path === "/api/admin/integrations/google-calendar" && method === "DELETE") {
    state.googleConnected = false;
    return json({ ok: true });
  }

  if (path === "/api/foods/capabilities" && method === "GET") {
    return json({
      capabilities: {
        tbca: true,
        taco: true,
        usdaConfigured: true,
        fatsecretConfigured: true
      }
    });
  }

  if (path === "/api/foods/search" && method === "GET") {
    const sourcesParam = url.searchParams.get("sources") || "tbca,taco";
    const sources = new Set(sourcesParam.split(",").map((part) => part.trim()));
    const results = demoFoodResults.filter((item) => sources.has(item.source));

    return json({
      results,
      provider: "mixed",
      capabilities: {
        tbca: true,
        taco: true,
        usdaConfigured: true,
        fatsecretConfigured: true
      }
    });
  }

  if (path.match(/^\/api\/foods\/fatsecret\/[^/]+$/) && method === "GET") {
    const id = path.split("/").pop();
    const food = demoFoodResults.find((item) => item.source === "fatsecret" && item.externalId === id);
    if (!food) return json({ message: "Alimento não encontrado." }, 404);
    return json({ food });
  }

  if (path.match(/^\/api\/foods\/usda\/[^/]+$/) && method === "GET") {
    const id = path.split("/").pop();
    const food = demoFoodResults.find((item) => item.source === "usda" && item.externalId === id);
    if (!food) return json({ message: "Alimento não encontrado." }, 404);
    return json({ food });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/diet$/) && method === "POST") {
    return json({ ok: true, planId: "diet-demo-new" });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/labs$/) && method === "GET") {
    const patient = path.split("/")[3];
    return json({
      reports: state.labReports.filter((report) => report.patient_id === patient)
    });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/labs$/) && method === "POST") {
    const patient = path.split("/")[3];
    const aiText = demoLabReport.ai_interpretation;
    const report = {
      id: `lab-${Date.now()}`,
      patient_id: patient,
      status: "draft",
      uploaded_by: "nutritionist",
      published_by: null,
      created_at: new Date().toISOString(),
      ai_interpretation: aiText,
      interpretation_summary: aiText,
      lab_results: demoLabReport.lab_results
    };
    state.labReports.unshift(report);
    return json({ report, results: report.lab_results });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/labs$/) && method === "PATCH") {
    const patient = path.split("/")[3];
    const body = await request.json();
    const report = state.labReports.find((item) => item.id === body.reportId && item.patient_id === patient);
    if (!report) return json({ message: "Laudo não encontrado." }, { status: 404 });

    if (body.interpretationSummary != null) report.interpretation_summary = body.interpretationSummary;
    if (body.status) {
      report.status = body.status;
      if (body.status === "published") {
        report.published_by = body.publishedBy || "nutritionist";
        report.reviewed_at = new Date().toISOString();
      }
    }

    return json({ report });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/insights$/) && method === "GET") {
    return json({ insights: demoInsights });
  }

  if (path === "/api/waitlist/position" && method === "GET") {
    return json({
      found: true,
      status: "waiting",
      position: 12,
      message: "Essa posição considera apenas pacientes ainda aguardando atendimento."
    });
  }

  if (path === "/api/waitlist/signup" && method === "POST") {
    return json({
      ok: true,
      status: "waiting",
      position: 63,
      message: "Cadastro realizado com sucesso. Guarde sua posição na fila."
    });
  }

  return json({ message: `Demo: rota não simulada (${method} ${path})` }, 404);
}
