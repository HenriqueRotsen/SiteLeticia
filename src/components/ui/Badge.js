import {
  labelAppointmentStatus,
  labelLabReportStatus,
  labelPaymentStatus
} from "@/lib/labels";

const variants = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
  danger: "bg-rose-50 text-rose-800 ring-rose-600/20",
  info: "bg-olive-50 text-olive-800 ring-olive-600/20",
  neutral: "bg-linen text-graphite/70 ring-olive-900/10"
};

export default function Badge({ children, variant = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function paymentBadge(status) {
  if (status === "paid") return { label: labelPaymentStatus(status), variant: "success" };
  if (status === "pending") return { label: labelPaymentStatus(status), variant: "warning" };
  if (status === "failed") return { label: labelPaymentStatus(status), variant: "danger" };
  if (status === "waived") return { label: labelPaymentStatus(status), variant: "neutral" };
  return { label: labelPaymentStatus(status), variant: "neutral" };
}

export function appointmentBadge(status) {
  if (status === "scheduled") return { label: labelAppointmentStatus(status), variant: "info" };
  if (status === "completed") return { label: labelAppointmentStatus(status), variant: "success" };
  if (status === "cancelled") return { label: labelAppointmentStatus(status), variant: "neutral" };
  if (status === "no_show") return { label: labelAppointmentStatus(status), variant: "danger" };
  return { label: labelAppointmentStatus(status), variant: "neutral" };
}

export function labReportBadge(status) {
  if (status === "draft") return { label: labelLabReportStatus(status), variant: "warning" };
  if (status === "published") return { label: labelLabReportStatus(status), variant: "success" };
  return { label: labelLabReportStatus(status), variant: "neutral" };
}

export { labelAppointmentStatus, labelLabReportStatus, labelPaymentStatus };
