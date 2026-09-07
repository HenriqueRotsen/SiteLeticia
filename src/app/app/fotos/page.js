"use client";

import { useEffect, useState } from "react";
import { Calendar, Camera, ImageIcon } from "lucide-react";
import PatientShell from "@/components/layout/PatientShell";
import { Card } from "@/components/layout/AppShell";
import ImageUploadZone from "@/components/ui/ImageUploadZone";

function PhotoCard({ photo }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-olive-900/10 bg-porcelain/95 shadow-card transition hover:shadow-card-hover">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-olive-100 via-linen to-olive-50">
        {photo.url ? (
          <img
            src={photo.url}
            alt={photo.caption || "Foto de evolução"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-olive-700/70">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
                <ImageIcon className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium">Foto indisponível</p>
            </div>
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-graphite shadow-sm">
          <Calendar className="h-3 w-3 text-olive-700" />
          {new Date(photo.taken_at).toLocaleDateString("pt-BR")}
        </span>
      </div>
      <div className="p-4">
        <p className="font-medium text-graphite">{photo.caption || "Sem legenda"}</p>
        <p className="mt-1 text-xs text-graphite/45">Registrada no seu acompanhamento</p>
      </div>
    </article>
  );
}

export default function FotosPage() {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPhotos() {
    const res = await fetch("/api/patients/me/photos");
    const data = await res.json();
    setPhotos(data.photos || []);
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  async function handleUpload(file) {
    setUploading(true);
    setFeedback("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/patients/me/photos", { method: "POST", body: formData });
    setUploading(false);

    if (!res.ok) {
      const data = await res.json();
      setFeedback(data.message || "Erro no upload.");
      return;
    }

    setSuccess("Foto enviada com sucesso.");
    await loadPhotos();
  }

  return (
    <PatientShell
      title="Fotos"
      subtitle="Registre sua evolução visual ao longo do acompanhamento"
      breadcrumbs={["Paciente", "Fotos"]}
    >
      <Card className="mb-6">
        <ImageUploadZone
          label="Enviar foto de evolução"
          description="Fotos ajudam a Letícia a acompanhar mudanças corporais, postura e evolução do tratamento."
          uploading={uploading}
          onFileSelect={handleUpload}
        />

        {feedback ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {feedback}
          </p>
        ) : null}

        {success ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
      </Card>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-graphite">Suas fotos</h2>
          <p className="text-sm text-graphite/55">
            {photos.length
              ? `${photos.length} registro${photos.length > 1 ? "s" : ""} na timeline`
              : "Nenhuma foto enviada ainda"}
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-xl bg-olive-100 px-3 py-2 text-sm font-medium text-olive-800 sm:flex">
          <Camera className="h-4 w-4" />
          Timeline visual
        </div>
      </div>

      {photos.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-olive-100 text-olive-700">
              <Camera className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <p className="mt-4 font-medium text-graphite">Nenhuma foto ainda</p>
            <p className="mt-2 max-w-sm text-sm text-graphite/55">
              Envie a primeira foto de evolução usando a área acima. Ela aparecerá aqui em ordem cronológica.
            </p>
          </div>
        </Card>
      )}
    </PatientShell>
  );
}
