"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import { Card, formatCurrency } from "@/components/layout/AppShell";
import Badge, { appointmentBadge, paymentBadge } from "@/components/ui/Badge";
import AppointmentsToolbar from "@/components/ui/AppointmentsToolbar";
import SortableTh from "@/components/ui/SortableTh";
import TablePagination from "@/components/ui/TablePagination";
import { formatAppointmentDateTime } from "@/lib/datetime";
import {
  APPOINTMENT_PAGE_SIZE,
  filterAppointments,
  paginateRows,
  sortAppointments
} from "@/lib/appointments/table-utils";

const DEFAULT_FILTERS = {
  query: "",
  period: "all",
  status: "all",
  paymentStatus: "all"
};

export default function AdminConsultasPage() {
  const [appointments, setAppointments] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState("starts_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/appointments")
      .then((r) => r.json())
      .then((data) => setAppointments(data.appointments || []))
      .catch(() => setError("Não foi possível carregar as consultas."));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters, sortKey, sortDir]);

  const filtered = useMemo(
    () => filterAppointments(appointments, filters, { includePatient: true }),
    [appointments, filters]
  );

  const sorted = useMemo(
    () => sortAppointments(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir]
  );

  const pagination = useMemo(
    () => paginateRows(sorted, page, APPOINTMENT_PAGE_SIZE),
    [sorted, page]
  );

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "patient" ? "asc" : "desc");
  }

  return (
    <AdminShell title="Consultas" breadcrumbs={["Admin", "Consultas"]} userName="Letícia">
      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <Card className="mb-4">
        <AppointmentsToolbar
          filters={filters}
          onChange={setFilters}
          total={appointments.length}
          filteredTotal={filtered.length}
          showPatientHint
        />
      </Card>

      <Card>
        {!pagination.rows.length ? (
          <p className="py-8 text-center text-sm text-graphite/50">
            Nenhuma consulta encontrada com esses filtros.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-olive-900/10">
                    <SortableTh
                      label="Paciente"
                      sortKey="patient"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="Data"
                      sortKey="starts_at"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="Status"
                      sortKey="status"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="Pagamento"
                      sortKey="payment"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="Valor"
                      sortKey="amount"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                    <th className="py-2 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-graphite/50">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.rows.map((appt) => {
                    const status = appointmentBadge(appt.status);
                    const payment = paymentBadge(appt.payment_status);

                    return (
                      <tr key={appt.id} className="border-t border-olive-900/5 hover:bg-linen/50">
                        <td className="py-3 pr-3 font-medium text-graphite">
                          {appt.patients?.full_name || "—"}
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap text-graphite/70">
                          {formatAppointmentDateTime(appt.starts_at)}
                        </td>
                        <td className="py-3 pr-3">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="py-3 pr-3">
                          <Badge variant={payment.variant}>{payment.label}</Badge>
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap text-graphite/70">
                          {formatCurrency(appt.amount_cents)}
                        </td>
                        <td className="py-3 pr-3">
                          <Link
                            href={`/admin/consultas/${appt.id}`}
                            className="font-semibold text-olive-800 hover:underline"
                          >
                            Detalhes
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <TablePagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={APPOINTMENT_PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </AdminShell>
  );
}
