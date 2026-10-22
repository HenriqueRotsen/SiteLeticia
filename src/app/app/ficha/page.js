"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import PatientShell from "@/components/layout/PatientShell";
import { Card } from "@/components/layout/AppShell";
import PreconsultForm from "@/components/ui/PreconsultForm";

export default function FichaPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(null);
  const [patient, setPatient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/patients/me/preconsulta")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!active) return;
        if (!ok) {
          setLoadError(data.message || "Não foi possível carregar a ficha. Atualize a página.");
        } else {
          setForm(data.form || null);
          setPatient(data.patient || null);
        }
      })
      .catch(() => {
        if (active) setLoadError("Não foi possível carregar a ficha. Atualize a página.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveProgress(answers) {
    const res = await fetch("/api/patients/me/preconsulta", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, submit: false })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Não foi possível salvar o progresso.");
    setForm(data.form);
    return data.form;
  }

  async function submit(answers) {
    setSaving(true);
    setFeedback("");
    const res = await fetch("/api/patients/me/preconsulta", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, submit: true })
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setFeedback(data.message || "Não foi possível enviar a ficha.");
      return;
    }
    setForm(data.form);
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <PatientShell
      title="Ficha pré-consulta"
      subtitle="Opcional, mas ajuda muito"
      breadcrumbs={["Paciente", "Ficha"]}
    >
      {loading ? (
        <Card>
          <p className="text-sm text-graphite/55">Carregando ficha…</p>
        </Card>
      ) : loadError ? (
        <Card>
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{loadError}</p>
        </Card>
      ) : done ? (
        <Card className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-olive-100 text-olive-700">
            <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <h2 className="mt-4 font-display text-3xl text-graphite">Ficha enviada. Obrigada!</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-graphite/65">
            A Letícia já pode ler suas respostas antes da consulta. Se lembrar de algo, você pode voltar aqui e
            atualizar.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/app/consultas"
              className="inline-flex items-center justify-center rounded-full bg-graphite px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-porcelain transition hover:bg-olive-800"
            >
              Ver minhas consultas
            </Link>
            <button
              type="button"
              onClick={() => setDone(false)}
              className="inline-flex items-center justify-center rounded-full border border-graphite/15 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-graphite/70 transition hover:border-graphite"
            >
              Revisar respostas
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedback ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{feedback}</p>
          ) : null}
          <PreconsultForm
            initialAnswers={form?.answers}
            initialStatus={form?.status || "draft"}
            patientProfile={patient}
            submitting={saving}
            onSubmit={submit}
            onSaveProgress={saveProgress}
          />
        </div>
      )}
    </PatientShell>
  );
}
