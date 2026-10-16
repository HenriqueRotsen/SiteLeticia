"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Upload } from "lucide-react";

const defaultAccept = "image/jpeg,image/png,image/webp";
const defaultHint = "JPEG, PNG ou WebP · até 10 MB";

export default function ImageUploadZone({
  label = "Enviar foto",
  description = "Arraste uma imagem aqui ou clique para selecionar do dispositivo.",
  accept = defaultAccept,
  hint = defaultHint,
  uploading = false,
  disabled = false,
  onFileSelect
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");

  const resetPreview = useCallback(() => {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setFileName("");
  }, []);

  const handleFile = useCallback(
    async (file) => {
      if (!file || disabled || uploading) return;

      resetPreview();
      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
      await onFileSelect?.(file);
    },
    [disabled, onFileSelect, resetPreview, uploading]
  );

  function onInputChange(event) {
    const file = event.target.files?.[0];
    handleFile(file);
    event.target.value = "";
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    handleFile(event.dataTransfer.files?.[0]);
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
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition ${
          dragging
            ? "border-olive-500 bg-olive-100/70 ring-4 ring-olive-100"
            : "border-olive-300/80 bg-gradient-to-br from-olive-50/80 via-porcelain to-linen/80 hover:border-olive-400 hover:bg-olive-50/60"
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
              <ImagePlus className="h-7 w-7" strokeWidth={1.75} />
            )}
          </div>

          <p className="mt-5 text-sm font-semibold text-graphite">
            {uploading ? "Enviando foto..." : dragging ? "Solte para enviar" : "Clique ou arraste sua foto"}
          </p>
          <p className="mt-2 max-w-sm text-sm text-graphite/55">{hint}</p>

          <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-olive-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm">
            <Camera className="h-4 w-4" />
            Escolher arquivo
          </span>
        </label>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={onInputChange}
        />

        {preview ? (
          <div className="border-t border-olive-900/10 bg-porcelain/90 p-4">
            <div className="flex items-center gap-4">
              <div
                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-olive-900/10 bg-linen bg-cover bg-center"
                style={{ backgroundImage: `url(${preview})` }}
                role="img"
                aria-label="Pré-visualização"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-graphite">{fileName}</p>
                <p className="mt-1 text-xs text-graphite/45">
                  {uploading ? "Upload em andamento..." : "Pronto para revisão após envio"}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
