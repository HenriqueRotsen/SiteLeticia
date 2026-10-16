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
import { getSeedPresetsAsRows } from "@/lib/presets/seed";
import { extractDietPlanFromCsvBuffer } from "@/lib/diets/fatsecret-csv";

let state = createInitialDemoState();

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

export function resetDemoState() {
  state = createInitialDemoState();
}

function docsForAppointment(appointmentId) {
  return (state.appointmentDocuments || [])
    .filter((doc) => doc.appointment_id === appointmentId)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

function summarizeDemoDocs(documents = []) {
  const proofs = documents.filter((d) => d.doc_type === "payment_proof");
  const invoices = documents.filter((d) => d.doc_type === "invoice");
  return {
    latestProof: proofs[0] || null,
    latestInvoice: invoices[0] || null,
    hasProof: proofs.length > 0,
    hasInvoice: invoices.length > 0,
    hasMismatch: documents.some((d) => d.amount_matches === false)
  };
}

function patientHasValidatedPaymentDemo(patientIdValue) {
  return (state.appointments || []).some(
    (appt) =>
      appt.patient_id === patientIdValue &&
      (appt.payment_status === "paid" || appt.payment_status === "waived")
  );
}

function ensureDemoPresets() {
  if (!state.presets?.length) {
    state.presets = getSeedPresetsAsRows();
  }
  return state.presets;
}

function createDemoDocument({ appointment, fileName, docType, uploadedByRole, amountCents }) {
  const matches = amountCents === appointment.amount_cents;
  return {
    id: `doc-${Date.now()}`,
    appointment_id: appointment.id,
    patient_id: appointment.patient_id,
    doc_type: docType,
    storage_path: `demo/${appointment.id}/${docType}-${Date.now()}.pdf`,
    mime_type: "application/pdf",
    file_name: fileName || `${docType}.pdf`,
    uploaded_by_role: uploadedByRole,
    extracted_amount_cents: amountCents,
    extracted_paid_at: new Date().toISOString(),
    extracted_payer_name: demoPatient.full_name,
    extraction_status: "ok",
    extraction_json: { method: "demo", confidence: 1 },
    amount_matches: matches,
    url: null,
    created_at: new Date().toISOString()
  };
}

export async function handleDemoApi(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === "/api/auth/login" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").toLowerCase();
    const isNutritionist =
      email.includes("leticia") || email.includes("nutri") || email.endsWith("@admin.local");
    return json({
      ok: true,
      role: isNutritionist ? "nutritionist" : "patient",
      redirectTo: isNutritionist ? "/admin" : "/app"
    });
  }
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
  if (path === "/api/auth/mfa/verify" && method === "POST") {
    return json({ ok: true, role: "patient", redirectTo: "/app" });
  }
  if (path === "/api/auth/mfa/resend" && method === "POST") {
    return json({ ok: true, message: "Modo demo: código simulado." });
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

  const patientCancelMatch = path.match(/^\/api\/appointments\/([^/]+)$/);
  if (patientCancelMatch && method === "PATCH") {
    const body = await request.json().catch(() => ({}));
    if (body.status !== "cancelled") return json({ message: "Ação inválida." }, 400);
    const appt = state.appointments.find((a) => a.id === patientCancelMatch[1]);
    if (!appt) return json({ message: "Consulta não encontrada." }, 404);
    appt.status = "cancelled";
    return json({ appointment: appt });
  }

  const adminCancelMatch = path.match(/^\/api\/admin\/appointments\/([^/]+)$/);
  if (adminCancelMatch && method === "PATCH") {
    const body = await request.json().catch(() => ({}));
    if (body.status !== "cancelled") return json({ message: "Ação inválida." }, 400);
    const appt = state.appointments.find((a) => a.id === adminCancelMatch[1]);
    if (!appt) return json({ message: "Consulta não encontrada." }, 404);
    appt.status = "cancelled";
    return json({ appointment: appt });
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
  if (path === "/api/patients/me/diet" && method === "GET") {
    if (!patientHasValidatedPaymentDemo(patientId)) {
      return json({
        dietPlan: null,
        dietPlans: [],
        patientName: state.patientProfile?.full_name || demoPatient.full_name,
        paymentGate: {
          locked: true,
          reason:
            "Sua prescrição será liberada após o envio do comprovante de pagamento e a validação pela nutricionista."
        }
      });
    }
    const plans = (state.dietPlans || [])
      .filter(
        (plan) =>
          (plan.patient_id === patientId || !plan.patient_id) &&
          (plan.status === "active" || plan.status === "archived")
      )
      .slice()
      .sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (b.status === "active" && a.status !== "active") return 1;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
    const activePlan = plans.find((plan) => plan.status === "active") || null;
    return json({
      dietPlan: activePlan,
      dietPlans: plans,
      patientName: state.patientProfile?.full_name || demoPatient.full_name,
      paymentGate: { locked: false }
    });
  }

  if (path.match(/^\/api\/appointments\/[^/]+\/documents$/) && method === "GET") {
    const id = path.split("/")[3];
    const appointment = state.appointments.find((a) => a.id === id && a.patient_id === patientId);
    if (!appointment) return json({ message: "Consulta não encontrada." }, 404);
    const documents = docsForAppointment(id);
    return json({
      documents,
      summary: summarizeDemoDocs(documents),
      appointment: {
        id: appointment.id,
        amount_cents: appointment.amount_cents,
        payment_status: appointment.payment_status
      }
    });
  }

  if (path.match(/^\/api\/appointments\/[^/]+\/documents$/) && method === "POST") {
    const id = path.split("/")[3];
    const appointment = state.appointments.find((a) => a.id === id && a.patient_id === patientId);
    if (!appointment) return json({ message: "Consulta não encontrada." }, 404);
    const document = createDemoDocument({
      appointment,
      fileName: "comprovante-demo.pdf",
      docType: "payment_proof",
      uploadedByRole: "patient",
      amountCents: appointment.amount_cents
    });
    state.appointmentDocuments = [document, ...(state.appointmentDocuments || [])];
    return json({ document });
  }

  if (path === "/api/patients/me/finance" && method === "GET") {
    const rows = state.appointments
      .filter((a) => a.patient_id === patientId)
      .map((appt) => {
        const documents = docsForAppointment(appt.id);
        return { ...appt, documents, summary: summarizeDemoDocs(documents) };
      });
    const paid = rows.filter((r) => r.payment_status === "paid");
    return json({
      summary: {
        expensesCents: paid.reduce((sum, r) => sum + (r.amount_cents || 0), 0),
        paidCount: paid.length,
        pendingCount: rows.filter((r) => r.payment_status === "pending").length
      },
      appointments: rows
    });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/diet\/extract$/) && method === "POST") {
    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    const titleOverride = formData?.get("title")?.toString()?.trim();
    const defaultTitle =
      titleOverride || `Plano alimentar FatSecret · ${demoPatient.full_name || "paciente"}`;

    if (!file || typeof file === "string") {
      return json({ message: "CSV obrigatório." }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extraction;
    try {
      extraction = await extractDietPlanFromCsvBuffer(buffer, { title: defaultTitle });
    } catch (error) {
      console.error("Demo diet CSV extract failed:", error);
      return json({ message: "Não foi possível ler o CSV da dieta." }, 500);
    }

    if (!extraction.plan?.meals?.length) {
      return json(
        {
          message:
            "Não encontramos refeições no arquivo. Use o export CSV Detailed Report do FatSecret."
        },
        400
      );
    }

    const plan = {
      ...extraction.plan,
      title: titleOverride || extraction.plan.title || defaultTitle,
      notes: extraction.plan.notes || "",
      status: "active",
      source: "fatsecret_csv",
      sourcePdfPath: null,
      extractionSummary: extraction.summary,
      extractionMethod: extraction.method
    };

    return json({
      ok: true,
      plan,
      summary: extraction.summary,
      method: extraction.method,
      warning: extraction.warning
    });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/diet$/) && method === "GET") {
    const targetPatientId = path.split("/")[3];
    if (!state.dietPlans) state.dietPlans = [{ ...demoDietPlan }];

    const belongsToPatient = (plan) =>
      plan.patient_id === targetPatientId || (!plan.patient_id && targetPatientId === patientId);

    // Autocorreção: no máximo um plano ativo por paciente (mantém o mais recente).
    const actives = state.dietPlans
      .filter((plan) => belongsToPatient(plan) && plan.status === "active")
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    if (actives.length > 1) {
      const keepId = actives[0].id;
      state.dietPlans = state.dietPlans.map((plan) =>
        belongsToPatient(plan) && plan.status === "active" && plan.id !== keepId
          ? { ...plan, status: "archived", updated_at: new Date().toISOString() }
          : plan
      );
    }

    const plans = state.dietPlans
      .filter(belongsToPatient)
      .slice()
      .sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (b.status === "active" && a.status !== "active") return 1;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
    return json({ dietPlans: plans });
  }
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
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthPaid = state.appointments.filter(
      (a) =>
        a.payment_status === "paid" &&
        new Date(a.starts_at) >= monthStart &&
        new Date(a.starts_at) <= monthEnd
    );
    const pendingValidation = state.appointments.filter(
      (a) => a.payment_status === "pending" && summarizeDemoDocs(docsForAppointment(a.id)).hasProof
    ).length;

    return json({
      stats: {
        patients: demoPatientsList.length,
        appointmentsToday: 1,
        pendingLabs: getDemoPendingLabReports(state.labReports).length,
        revenueMonthCents: monthPaid.reduce((sum, a) => sum + (a.amount_cents || 0), 0),
        pendingPaymentValidation: pendingValidation
      },
      upcoming: state.appointments.filter((a) => a.status === "scheduled")
    });
  }

  if (path === "/api/admin/finance" && method === "GET") {
    const month = url.searchParams.get("month");
    const match = String(month || "").match(/^(\d{4})-(\d{2})$/);
    const now = new Date();
    const year = match ? Number(match[1]) : now.getFullYear();
    const monthIndex = match ? Number(match[2]) - 1 : now.getMonth();
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    const rows = state.appointments
      .filter((a) => {
        const at = new Date(a.starts_at);
        return at >= start && at <= end;
      })
      .map((appt) => {
        const documents = docsForAppointment(appt.id);
        return { ...appt, documents, summary: summarizeDemoDocs(documents) };
      });
    const paid = rows.filter((r) => r.payment_status === "paid");
    const pendingValidation = rows.filter(
      (r) => r.payment_status === "pending" && r.summary.hasProof
    );
    return json({
      period: { year, month: monthIndex + 1, start: start.toISOString(), end: end.toISOString() },
      summary: {
        revenueCents: paid.reduce((sum, r) => sum + (r.amount_cents || 0), 0),
        paidCount: paid.length,
        waivedCount: rows.filter((r) => r.payment_status === "waived").length,
        pendingValidationCount: pendingValidation.length,
        awaitingProofCount: rows.filter((r) => r.payment_status === "pending" && !r.summary.hasProof)
          .length,
        mismatchCount: rows.filter((r) => r.summary.hasMismatch).length
      },
      appointments: rows,
      pendingValidation,
      mismatches: rows.filter((r) => r.summary.hasMismatch)
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
    if (body.bmrFormula !== undefined) demoPatient.bmr_formula = body.bmrFormula;
    if (body.weightKg != null) {
      demoPatient.latest_weight_kg = body.weightKg;
      demoPatient.latest_weight_at = new Date().toISOString();
    }
    return json({ patient: demoPatient });
  }

  if (path === "/api/admin/presets" && method === "GET") {
    const type = url.searchParams.get("type");
    const activeAll = url.searchParams.get("active") === "all";
    if (url.searchParams.get("resync") === "1") state.presets = [];
    let presets = ensureDemoPresets();
    if (type) presets = presets.filter((item) => item.type === type);
    if (!activeAll) presets = presets.filter((item) => item.active !== false);
    return json({ presets });
  }

  if (path === "/api/admin/presets" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    ensureDemoPresets();
    if (!["supplement_pack", "exam_order", "referral_letter"].includes(body.type)) {
      return json({ message: "Tipo de preset inválido." }, 400);
    }
    if (!String(body.title || "").trim()) {
      return json({ message: "Título obrigatório." }, 400);
    }
    const slugBase = String(body.slug || body.title)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const preset = {
      id: `preset-${Date.now()}`,
      type: body.type,
      title: String(body.title).trim(),
      slug: slugBase || `preset-${Date.now()}`,
      content: body.content || {},
      sortOrder: Number(body.sortOrder) || 0,
      active: body.active !== false
    };
    state.presets = [preset, ...state.presets];
    return json({ preset });
  }

  if (path.match(/^\/api\/admin\/presets\/[^/]+$/) && method === "PATCH") {
    const id = path.split("/").pop();
    const body = await request.json().catch(() => ({}));
    ensureDemoPresets();
    state.presets = state.presets.map((preset) =>
      preset.id === id
        ? {
            ...preset,
            title: body.title ?? preset.title,
            content: body.content ?? preset.content,
            active: body.active ?? preset.active
          }
        : preset
    );
    return json({ preset: state.presets.find((item) => item.id === id) });
  }

  if (path.match(/^\/api\/admin\/presets\/[^/]+$/) && method === "DELETE") {
    const id = path.split("/").pop();
    ensureDemoPresets();
    const before = state.presets.length;
    state.presets = state.presets.filter((preset) => preset.id !== id);
    if (state.presets.length === before) {
      return json({ message: "Preset não encontrado." }, 404);
    }
    return json({ ok: true });
  }

  if (path === "/api/admin/appointments" && method === "GET") {
    const filterPatientId = url.searchParams.get("patientId");
    const appointments = filterPatientId
      ? state.appointments.filter((item) => item.patient_id === filterPatientId)
      : state.appointments;
    return json({ appointments });
  }

  if (path.match(/^\/api\/admin\/appointments\/[^/]+\/documents$/) && method === "GET") {
    const id = path.split("/")[4];
    const appointment = state.appointments.find((a) => a.id === id);
    if (!appointment) return json({ message: "Consulta não encontrada." }, 404);
    const documents = docsForAppointment(id);
    return json({ documents, summary: summarizeDemoDocs(documents), appointment });
  }

  if (path.match(/^\/api\/admin\/appointments\/[^/]+\/documents$/) && method === "POST") {
    const id = path.split("/")[4];
    const appointment = state.appointments.find((a) => a.id === id);
    if (!appointment) return json({ message: "Consulta não encontrada." }, 404);
    const formData = await request.formData().catch(() => null);
    const docType = formData?.get("docType") === "payment_proof" ? "payment_proof" : "invoice";
    const document = createDemoDocument({
      appointment,
      fileName: docType === "invoice" ? "nota-fiscal-demo.pdf" : "comprovante-demo.pdf",
      docType,
      uploadedByRole: "nutritionist",
      amountCents: appointment.amount_cents
    });
    state.appointmentDocuments = [document, ...(state.appointmentDocuments || [])];
    return json({ document });
  }

  if (path.match(/^\/api\/admin\/appointments\/[^/]+\/payment$/) && method === "PATCH") {
    const id = path.split("/")[4];
    const body = await request.json();
    if (!["pending", "paid", "waived"].includes(body.paymentStatus)) {
      return json({ message: "Status inválido." }, 400);
    }
    if (body.paymentStatus === "paid" && !summarizeDemoDocs(docsForAppointment(id)).hasProof) {
      return json(
        { message: "Anexe ou aguarde o comprovante do paciente antes de validar." },
        400
      );
    }
    const now = new Date().toISOString();
    state.appointments = state.appointments.map((a) =>
      a.id === id
        ? {
            ...a,
            payment_status: body.paymentStatus,
            payment_validated_at:
              body.paymentStatus === "paid" || body.paymentStatus === "waived" ? now : null,
            payment_validated_by:
              body.paymentStatus === "paid" || body.paymentStatus === "waived"
                ? "demo-nutritionist-001"
                : null
          }
        : a
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
    const targetPatientId = path.split("/")[3];
    const contentType = request.headers.get("content-type") || "";
    let body = {};
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      try {
        body = JSON.parse(String(formData.get("plan") || "{}"));
      } catch {
        body = {};
      }
    } else {
      body = await request.json().catch(() => ({}));
    }

    if (!state.dietPlans) state.dietPlans = [{ ...demoDietPlan }];

    const nextStatus = body.status || "active";
    // Publicar ativo → arquiva automaticamente os planos ativos anteriores do mesmo paciente
    if (nextStatus === "active") {
      state.dietPlans = state.dietPlans.map((plan) => {
        const samePatient =
          plan.patient_id === targetPatientId ||
          (!plan.patient_id && targetPatientId === patientId);
        return samePatient && plan.status === "active"
          ? { ...plan, status: "archived", updated_at: new Date().toISOString() }
          : plan;
      });
    }

    const plan = {
      id: `diet-${Date.now()}`,
      patient_id: targetPatientId,
      title: body.title || "Plano demo",
      notes: body.notes || null,
      status: nextStatus,
      source: body.source || "fatsecret_csv",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      diet_meals: (body.meals || []).map((meal, index) => ({
        id: `meal-${Date.now()}-${index}`,
        name: meal.name,
        sort_order: meal.sortOrder ?? index,
        diet_items: (meal.items || []).map((item, itemIndex) => ({
          id: `item-${Date.now()}-${itemIndex}`,
          ...item,
          portion_g: item.portionG,
          nutrition_snapshot: item.nutritionSnapshot
        }))
      })),
      diet_supplements: (body.supplements || []).map((item, index) => ({
        id: `sup-${Date.now()}-${index}`,
        sort_order: item.sortOrder ?? index,
        product_name: item.productName,
        dosage: item.dosage,
        posology: item.posology,
        notes: item.notes || null,
        group_id: item.groupId || null,
        group_title: item.groupTitle || null
      })),
      diet_referrals: (body.referrals || []).map((item, index) => ({
        id: `ref-${Date.now()}-${index}`,
        sort_order: item.sortOrder ?? index,
        specialty: item.specialty,
        professional_name: item.professionalName || null,
        reason: item.reason,
        urgency: item.urgency || "routine",
        body_text: item.bodyText || null,
        notes: item.notes || null
      })),
      diet_exam_orders: (body.examOrders || []).map((item, index) => ({
        id: `exam-${Date.now()}-${index}`,
        sort_order: item.sortOrder ?? index,
        title: item.title || "Pedido de exames",
        exams: item.exams || [],
        collection_notes: item.collectionNotes || [],
        observations: item.observations || null,
        meta: item.meta || {}
      }))
    };

    state.dietPlans.unshift(plan);
    return json({ ok: true, planId: plan.id, plan, uploaded: false });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/diet\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const targetPatientId = parts[3];
    const planId = parts[5];
    const body = await request.json().catch(() => ({}));
    if (!state.dietPlans) state.dietPlans = [{ ...demoDietPlan }];
    if (body.status === "active") {
      state.dietPlans = state.dietPlans.map((plan) => {
        const samePatient =
          plan.patient_id === targetPatientId ||
          (!plan.patient_id && targetPatientId === patientId);
        return samePatient && plan.status === "active" && plan.id !== planId
          ? { ...plan, status: "archived", updated_at: new Date().toISOString() }
          : plan;
      });
    }
    state.dietPlans = state.dietPlans.map((plan) =>
      plan.id === planId
        ? { ...plan, status: body.status || plan.status, updated_at: new Date().toISOString() }
        : plan
    );
    const plan = state.dietPlans.find((item) => item.id === planId);
    if (!plan) return json({ message: "Plano não encontrado." }, 404);
    return json({ ok: true, plan });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/diet\/[^/]+$/) && method === "DELETE") {
    const planId = path.split("/").pop();
    if (!state.dietPlans) state.dietPlans = [];
    state.dietPlans = state.dietPlans.filter((plan) => plan.id !== planId);
    return json({ ok: true });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/prontuario$/) && method === "GET") {
    const patient = path.split("/")[3];
    if (!state.clinicalRecords) state.clinicalRecords = [];
    const records = state.clinicalRecords
      .filter((item) => item.patient_id === patient)
      .slice()
      .sort((a, b) => new Date(b.session_at || 0) - new Date(a.session_at || 0))
      .map((item) => ({
        ...item,
        body_text: item.body_text ?? item.body_md ?? ""
      }));
    return json({ records });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/prontuario$/) && method === "POST") {
    const patient = path.split("/")[3];
    if (!state.clinicalRecords) state.clinicalRecords = [];
    const body = await request.json().catch(() => ({}));
    const bodyText = String(body.bodyText ?? body.body_text ?? body.bodyMd ?? body.body_md ?? "");
    if (!bodyText.trim()) return json({ message: "Cole o texto do prontuário." }, 400);
    const sessionAt = body.sessionAt || body.session_at ? new Date(body.sessionAt || body.session_at) : new Date();
    const record = {
      id: `clinical-${Date.now()}`,
      patient_id: patient,
      appointment_id: body.appointmentId || body.appointment_id || null,
      session_at: Number.isNaN(sessionAt.getTime())
        ? new Date().toISOString()
        : sessionAt.toISOString(),
      title: String(body.title || "").trim() || null,
      body_text: bodyText,
      notes: null,
      storage_path: null,
      mime_type: "text/plain",
      file_name: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    state.clinicalRecords.unshift(record);
    return json({ record });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/prontuario$/) && method === "PATCH") {
    const patient = path.split("/")[3];
    if (!state.clinicalRecords) state.clinicalRecords = [];
    const body = await request.json().catch(() => ({}));
    const record = state.clinicalRecords.find(
      (item) => item.id === body.recordId && item.patient_id === patient
    );
    if (!record) return json({ message: "Registro não encontrado." }, 404);
    if (body.title !== undefined) record.title = String(body.title || "").trim() || null;
    if (
      body.bodyText !== undefined ||
      body.body_text !== undefined ||
      body.bodyMd !== undefined ||
      body.body_md !== undefined
    ) {
      const bodyText = String(body.bodyText ?? body.body_text ?? body.bodyMd ?? body.body_md ?? "");
      if (!bodyText.trim()) return json({ message: "Cole o texto do prontuário." }, 400);
      record.body_text = bodyText;
    }
    if (body.sessionAt !== undefined || body.session_at !== undefined) {
      const next = new Date(body.sessionAt ?? body.session_at);
      if (!Number.isNaN(next.getTime())) record.session_at = next.toISOString();
    }
    if (body.appointmentId !== undefined || body.appointment_id !== undefined) {
      record.appointment_id = body.appointmentId ?? body.appointment_id ?? null;
    }
    record.updated_at = new Date().toISOString();
    return json({ record });
  }

  if (path.match(/^\/api\/patients\/[^/]+\/prontuario\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const patient = parts[3];
    const recordId = parts[5];
    if (!state.clinicalRecords) state.clinicalRecords = [];
    const before = state.clinicalRecords.length;
    state.clinicalRecords = state.clinicalRecords.filter(
      (item) => !(item.id === recordId && item.patient_id === patient)
    );
    if (state.clinicalRecords.length === before) {
      return json({ message: "Registro não encontrado." }, 404);
    }
    return json({ ok: true });
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
