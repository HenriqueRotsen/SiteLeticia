"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, ImageIcon, RefreshCw, Trash2 } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnSecondary } from "@/components/layout/AppShell";
import { useDialog } from "@/components/ui/ConfirmDialog";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function PhotoTile({ photo, expired, onDelete }) {
  const usable = photo.url && !expired;
  return (
    <article className="overflow-hidden rounded-2xl border border-olive-900/10 bg-porcelain/95 shadow-card">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-olive-100 via-linen to-olive-50">
        {usable ? (
          <a href={photo.url} target="_blank" rel="noreferrer noopener" title="Abrir em tamanho original">
            {/* URL assinada do Supabase com validade curta: next/image não se aplica. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.caption || "Foto de evolução"}
              className="h-full w-full object-cover transition hover:scale-[1.02]"
              loading="lazy"
            />
          </a>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-olive-700/70">
            <ImageIcon className="h-7 w-7" strokeWidth={1.5} />
            <p className="text-xs font-medium">{expired ? "Link expirado" : "Foto indisponível"}</p>
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-graphite shadow-xs">
          <Calendar className="h-3 w-3" />
          {formatDate(photo.taken_at)}
        </span>
        <button
          type="button"
          onClick={() => onDelete(photo)}
          aria-label="Excluir foto"
          title="Excluir foto"
          className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-700 shadow-xs transition hover:bg-white"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {photo.visibility === "nutritionist_only" ? (
          <span className="absolute right-3 top-3 rounded-full bg-graphite/80 px-2.5 py-1 text-[11px] font-medium text-white">
            Só nutricionista
          </span>
        ) : null}
      </div>
      {photo.caption ? <p className="px-4 py-3 text-sm text-graphite/70">{photo.caption}</p> : null}
    </article>
  );
}

export default function AdminPatientPhotosPage() {
  const params = useParams();
  const patientId = params.id;
  const { confirm } = useDialog();
  const [patientName, setPatientName] = useState("");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [urlTtl, setUrlTtl] = useState({ seconds: 0, loadedAt: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setExpired(false);
    try {
      const res = await fetch(`/api/patients/${patientId}/photos`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Não foi possível carregar as fotos.");
      setPatientName(data.patient?.full_name || "");
      setPhotos(data.photos || []);
      setUrlTtl({ seconds: Number(data.expiresInSeconds) || 0, loadedAt: Date.now() });
    } catch (err) {
      setError(err.message);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  async function deletePhoto(photo) {
    const ok = await confirm({
      title: "Excluir esta foto?",
      message: "A foto é apagada do sistema e some também para o paciente.",
      confirmLabel: "Excluir",
      tone: "danger"
    });
    if (!ok) return;
    const res = await fetch(`/api/patients/${patientId}/photos?id=${encodeURIComponent(photo.id)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message || "Não foi possível excluir a foto.");
      return;
    }
    await load();
  }

  useEffect(() => {
    load();
  }, [load]);

  // Avisa um pouco antes de as URLs assinadas expirarem.
  useEffect(() => {
    if (!urlTtl.seconds) return undefined;
    const timer = setTimeout(() => setExpired(true), Math.max(urlTtl.seconds - 15, 15) * 1000);
    return () => clearTimeout(timer);
  }, [urlTtl]);

  return (
    <AdminShell
      title="Fotos de evolução"
      subtitle={patientName || "Paciente"}
      breadcrumbs={["Admin", { label: "Pacientes", href: "/admin/pacientes" }, { label: patientName || "Paciente", href: `/admin/pacientes/${patientId}` }, "Fotos"]}
      userName="Letícia"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/pacientes/${patientId}`} className={btnSecondary()}>
          <ArrowLeft className="h-4 w-4" />
          Voltar à ficha
        </Link>
        <button type="button" onClick={load} disabled={loading} className={btnSecondary()}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {expired ? (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Os links das fotos expiram em poucos minutos por segurança.{" "}
          <button type="button" onClick={load} className="font-semibold underline">
            Recarregar fotos
          </button>
        </p>
      ) : null}

      {error ? (
        <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : null}

      {loading && !photos.length ? (
        <p className="py-10 text-center text-sm text-graphite/45">Carregando fotos…</p>
      ) : photos.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo) => (
            <PhotoTile key={photo.id} photo={photo} expired={expired} onDelete={deletePhoto} />
          ))}
        </div>
      ) : !error ? (
        <Card>
          <p className="py-6 text-center text-sm text-graphite/45">
            O paciente ainda não enviou fotos de evolução.
          </p>
        </Card>
      ) : null}
    </AdminShell>
  );
}
