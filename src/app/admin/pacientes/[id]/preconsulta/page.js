"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { btnSecondary } from "@/components/layout/AppShell";
import PreconsultViewer from "@/components/ui/PreconsultViewer";

export default function AdminPatientPreconsultPage() {
  const params = useParams();
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/patients/${params.id}/preconsulta`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erro ao carregar ficha.");
        setPatient(data.patient || null);
        setForm(data.form || null);
      })
      .catch((err) => setError(err.message || "Erro ao carregar ficha."))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <AdminShell
      title="Ficha pré-consulta"
      breadcrumbs={["Admin", "Pacientes", patient?.full_name || "…", "Pré-consulta"]}
      userName="Letícia"
    >
      <div className="mb-4">
        <Link href={`/admin/pacientes/${params.id}`} className={btnSecondary()}>
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Voltar ao paciente
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-graphite/55">Carregando ficha…</p>
      ) : error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : (
        <PreconsultViewer form={form} patientName={patient?.full_name} />
      )}
    </AdminShell>
  );
}
