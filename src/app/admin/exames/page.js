"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, FlaskConical } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card } from "@/components/layout/AppShell";
import Badge, { labReportBadge } from "@/components/ui/Badge";

export default function AdminPendingLabsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/labs/pending")
      .then((r) => r.json())
      .then((data) => setReports(data.reports || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      title="Exames pendentes"
      subtitle="PDFs enviados pelos pacientes aguardando revisão e publicação"
      breadcrumbs={["Admin", "Exames pendentes"]}
      userName="Letícia"
    >
      <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-amber-900">Fila de revisão</p>
            <p className="mt-2 text-2xl font-semibold text-graphite">
              {loading ? "..." : reports.length}{" "}
              {reports.length === 1 ? "exame pendente" : "exames pendentes"}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/65">
              Revise a extração, ajuste a interpretação se necessário e publique para o paciente visualizar no
              portal.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <FlaskConical className="h-6 w-6" strokeWidth={1.75} />
          </div>
        </div>
      </div>

      {loading ? (
        <Card>
          <p className="py-10 text-center text-sm text-graphite/45">Carregando exames...</p>
        </Card>
      ) : reports.length ? (
        <div className="space-y-4">
          {reports.map((report) => {
            const badge = labReportBadge("draft");

            return (
              <Card key={report.id}>
                <article className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                      <FileText className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-graphite">
                          {report.patients?.full_name || "Paciente"}
                        </p>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-graphite/55">
                        Enviado em {new Date(report.created_at).toLocaleString("pt-BR")}
                      </p>
                      {report.interpretation_summary ? (
                        <p className="mt-3 text-sm leading-6 text-graphite/70">{report.interpretation_summary}</p>
                      ) : (
                        <p className="mt-3 text-sm text-graphite/45">PDF aguardando revisão.</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/pacientes/${report.patient_id}/exames`}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-olive-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-800"
                  >
                    Revisar exame
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="rounded-2xl border border-dashed border-olive-300/70 bg-linen/60 px-4 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-olive-100 text-olive-700">
              <FlaskConical className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <p className="mt-4 font-medium text-graphite">Nenhum exame pendente</p>
            <p className="mt-2 text-sm text-graphite/55">
              Quando pacientes enviarem PDFs, eles aparecerão nesta página para revisão.
            </p>
          </div>
        </Card>
      )}
    </AdminShell>
  );
}
