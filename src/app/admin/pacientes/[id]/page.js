"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/layout/AppShell";

function formatPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

export default function AdminPatientDetailPage() {
  const params = useParams();
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/patients/${params.id}`)
      .then((r) => r.json())
      .then((d) => setPatient(d.patient));
  }, [params.id]);

  if (!patient) {
    return (
      <AdminShell title="Paciente" breadcrumbs={["Admin", "Pacientes"]} userName="Letícia">
        <p>Carregando...</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={patient.full_name} breadcrumbs={["Admin", "Pacientes", patient.full_name]} userName="Letícia">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-3 flex flex-wrap gap-2">
            {patient.from_waitlist ? <Badge variant="warning">Fila de espera</Badge> : null}
            {!patient.has_account ? <Badge variant="neutral">Sem conta na plataforma</Badge> : null}
          </div>
          <p className="text-sm text-graphite/60">CPF</p>
          <p className="font-semibold">{patient.cpf_masked}</p>
          <p className="mt-3 text-sm text-graphite/60">WhatsApp</p>
          <p>{formatPhone(patient.phone)}</p>
          <p className="mt-3 text-sm text-graphite/60">Objetivo</p>
          <p>{patient.goal}</p>
          {!patient.has_account ? (
            <p className="mt-4 rounded-xl bg-linen-100 px-3 py-2 text-sm text-graphite/70">
              Quando esta pessoa criar conta com o mesmo WhatsApp e informar o CPF, o prontuário será vinculado automaticamente.
            </p>
          ) : null}
        </Card>
        <Card>
          <h2 className="font-semibold">Prontuário</h2>
          <div className="mt-4 grid gap-2">
            <Link href={`/admin/pacientes/${params.id}/dieta`} className="rounded-xl bg-olive-50 px-4 py-3 font-semibold text-olive-900">
              Montar dieta
            </Link>
            <Link href={`/admin/pacientes/${params.id}/exames`} className="rounded-xl bg-olive-50 px-4 py-3 font-semibold text-olive-900">
              Exames laboratoriais
            </Link>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
