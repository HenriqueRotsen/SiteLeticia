"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PatientShell from "@/components/layout/PatientShell";
import { Card, formatCurrency } from "@/components/layout/AppShell";
import Badge, { appointmentBadge, paymentBadge } from "@/components/ui/Badge";
import AppointmentsToolbar from "@/components/ui/AppointmentsToolbar";
import SortableTh from "@/components/ui/SortableTh";
import TablePagination from "@/components/ui/TablePagination";
import { formatAppointmentDateTime, resolveAppointmentAmountCents } from "@/lib/datetime";
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

export default function ConsultasPage() {
  const [appointments, setAppointments] = useState([]);
  const [payment, setPayment] = useState({ settings: {}, methods: [] });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState("starts_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [a, p] = await Promise.all([
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/payment-info").then((r) => r.json())
    ]);
    setAppointments(a.appointments || []);
    setPayment(p);
  }, []);

  useEffect(() => {
    load().catch(() => setError("Não foi possível carregar as consultas."));
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filters, sortKey, sortDir]);

  const filtered = useMemo(() => filterAppointments(appointments, filters), [appointments, filters]);

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
    setSortDir("desc");
  }

  return (
    <PatientShell title="Minhas consultas" breadcrumbs={["Paciente", "Consultas"]}>
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
        />
      </Card>

      <Card>
        {!appointments.length ? (
          <p className="py-8 text-center text-sm text-graphite/55">Você ainda não tem consultas.</p>
        ) : !pagination.rows.length ? (
          <p className="py-8 text-center text-sm text-graphite/55">
            Nenhuma consulta encontrada com esses filtros.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-olive-900/10">
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
                    const paymentBadgeInfo = paymentBadge(appt.payment_status);
                    const amountCents = resolveAppointmentAmountCents(appt, payment.settings);

                    return (
                      <tr key={appt.id} className="border-t border-olive-900/5 hover:bg-linen/50">
                        <td className="py-3 pr-3 whitespace-nowrap font-medium text-graphite">
                          {formatAppointmentDateTime(appt.starts_at)}
                        </td>
                        <td className="py-3 pr-3">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="py-3 pr-3">
                          <Badge variant={paymentBadgeInfo.variant}>{paymentBadgeInfo.label}</Badge>
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap text-graphite/70">
                          {formatCurrency(amountCents)}
                        </td>
                        <td className="py-3 pr-3">
                          <Link
                            href={`/app/consultas/${appt.id}`}
                            className="font-semibold text-olive-800 hover:underline"
                          >
                            Abrir
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

      <Card className="mt-4">
        <h3 className="font-semibold">Instruções de pagamento</h3>
        <p className="mt-2 text-sm text-graphite/70">{payment.settings?.instructions}</p>
        <p className="mt-2 text-sm text-graphite/70">{payment.settings?.cancellation_policy}</p>
      </Card>
    </PatientShell>
  );
}
