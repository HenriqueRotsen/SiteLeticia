"use client";

import { useId, useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";

export default function PdfUploadZone({
  label = "Enviar PDF",
  description = "Arraste o laudo em PDF ou clique para selecionar.",
  hint = "PDF · até 10 MB",
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
    <div className="space-y-4">
      <div>
        <p className="text-base font-semibold text-graphite">{label}</p>
        {description ? <p className="mt-1 text-sm text-graphite/55">{description}</p> : null}
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
          if (disabled || uploading) return;
          handleFile(event.dataTransfer.files?.[0]);
        }}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition ${
          dragging
            ? "border-olive-500 bg-olive-100/70 ring-4 ring-olive-100"
            : "border-olive-300/80 bg-gradient-to-br from-olive-50/80 via-porcelain to-linen/80 hover:border-olive-400"
        } ${disabled || uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center justify-center px-6 py-10 text-center sm:py-12"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-olive-700 text-white shadow-sm">
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin" strokeWidth={1.75} />
            ) : dragging ? (
              <Upload className="h-7 w-7" strokeWidth={1.75} />
            ) : (
              <FileText className="h-7 w-7" strokeWidth={1.75} />
            )}
          </div>
          <p className="mt-5 text-sm font-semibold text-graphite">
            {uploading ? "Processando PDF..." : dragging ? "Solte o arquivo" : "Clique ou arraste o PDF"}
          </p>
          <p className="mt-2 text-sm text-graphite/55">{hint}</p>
        </label>
        <input
          id={inputId}
          type="file"
          accept="application/pdf"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        {fileName ? (
          <div className="border-t border-olive-900/10 bg-porcelain/90 px-4 py-3 text-sm text-graphite/70">
            Arquivo: <span className="font-medium text-graphite">{fileName}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
