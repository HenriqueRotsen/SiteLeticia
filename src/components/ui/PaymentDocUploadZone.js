"use client";

import { useId, useState } from "react";
import { FileUp, Loader2, Upload } from "lucide-react";

export default function PaymentDocUploadZone({
  label = "Enviar comprovante",
  description = "PDF ou foto do comprovante de pagamento.",
  hint = "PDF, JPEG, PNG ou WebP · até 10 MB",
  uploading = false,
  disabled = false,
  onFileSelect
}) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  async function handleFile(file) {
    if (!file || disabled || uploading) return;
    setFileName(file.name);
    await onFileSelect?.(file);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-graphite">{label}</p>
        {description ? <p className="mt-1 text-xs text-graphite/55">{description}</p> : null}
      </div>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && !uploading) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          handleFile(file);
        }}
        className={`rounded-xl border border-dashed px-4 py-5 text-center transition ${
          dragging
            ? "border-olive-500 bg-olive-50"
            : "border-olive-900/15 bg-linen/40 hover:border-olive-400"
        } ${disabled || uploading ? "opacity-60" : ""}`}
      >
        <input
          id={inputId}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            handleFile(file);
            event.target.value = "";
          }}
        />
        <label htmlFor={inputId} className="flex cursor-pointer flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-olive-700" />
          ) : (
            <FileUp className="h-6 w-6 text-olive-700" strokeWidth={1.5} />
          )}
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-olive-800">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Enviando..." : "Selecionar arquivo"}
          </span>
          <span className="text-xs text-graphite/45">{hint}</span>
          {fileName ? <span className="text-xs text-graphite/60">{fileName}</span> : null}
        </label>
      </div>
    </div>
  );
}
