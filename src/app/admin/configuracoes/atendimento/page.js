"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, MapPin } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary } from "@/components/layout/AppShell";
import {
  formatAddress,
  formatCep,
  googleMapsEmbedUrl,
  googleMapsLink,
  isAddressComplete,
  normalizeCep
} from "@/lib/appointments/location";

const EMPTY = {
  placeName: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: ""
};

const inputClass =
  "mt-1 w-full rounded-xl border border-olive-900/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-olive-500 focus:ring-2 focus:ring-olive-200";

function Field({ label, hint, className = "", children }) {
  return (
    <label className={`block text-sm font-medium text-graphite ${className}`}>
      {label}
      {children}
      {hint ? <span className="mt-1 block text-xs font-normal text-graphite/45">{hint}</span> : null}
    </label>
  );
}

export default function AtendimentoConfigPage() {
  const [address, setAddress] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cepStatus, setCepStatus] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [mapAddress, setMapAddress] = useState(null);

  useEffect(() => {
    fetch("/api/admin/clinic-address")
      .then((res) => res.json())
      .then((data) => {
        if (data.address) {
          const loaded = { ...EMPTY, ...data.address };
          setAddress(loaded);
          if (isAddressComplete(loaded)) setMapAddress(loaded);
        }
        if (data.needsMigration) setError(data.message);
      })
      .catch(() => setError("Não foi possível carregar o endereço."))
      .finally(() => setLoading(false));
  }, []);

  // O mapa só atualiza quando o endereço para de mudar (evita recarregar a cada tecla).
  useEffect(() => {
    if (!isAddressComplete(address)) return undefined;
    const timer = setTimeout(() => setMapAddress(address), 700);
    return () => clearTimeout(timer);
  }, [address]);

  const embedUrl = useMemo(() => (mapAddress ? googleMapsEmbedUrl(mapAddress) : null), [mapAddress]);
  const complete = isAddressComplete(address);

  function update(field, value) {
    setAddress((current) => ({ ...current, [field]: value }));
    setFeedback("");
  }

  async function lookupCep(rawCep) {
    const cep = normalizeCep(rawCep);
    if (cep.length !== 8) return;
    setLookingUp(true);
    setCepStatus("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!res.ok || data.erro) {
        setCepStatus("CEP não encontrado. Preencha o endereço manualmente.");
        return;
      }
      setAddress((current) => ({
        ...current,
        cep,
        street: data.logradouro || current.street,
        district: data.bairro || current.district,
        city: data.localidade || current.city,
        state: data.uf || current.state,
        complement: current.complement || data.complemento || ""
      }));
      setCepStatus("Endereço encontrado. Confira e informe o número.");
      setTimeout(() => document.getElementById("clinic-number")?.focus(), 50);
    } catch {
      setCepStatus("Não foi possível buscar o CEP agora. Preencha manualmente.");
    } finally {
      setLookingUp(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFeedback("");
    const res = await fetch("/api/admin/clinic-address", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address })
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.message || "Não foi possível salvar.");
      return;
    }
    setAddress({ ...EMPTY, ...data.address });
    setMapAddress(data.address);
    setFeedback("Endereço salvo. Ele vai nas consultas presenciais e no convite do Google Agenda.");
  }

  return (
    <AdminShell
      title="Endereço de atendimento"
      subtitle="Onde acontecem as consultas presenciais"
      breadcrumbs={["Admin", "Configurações", "Endereço de atendimento"]}
      userName="Letícia"
    >
      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : null}
      {feedback ? (
        <p className="mb-4 rounded-xl border border-olive-200 bg-olive-50 px-4 py-3 text-sm text-olive-900">
          {feedback}
        </p>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <Card>
          {loading ? (
            <p className="text-sm text-graphite/55">Carregando…</p>
          ) : (
            <form onSubmit={save} className="space-y-4">
              <p className="text-sm leading-6 text-graphite/60">
                Digite o CEP e o resto do endereço é preenchido sozinho. Depois é só informar o número.
              </p>

              <Field label="Nome do local" hint="Opcional. Ex.: Clínica Bem Viver, Edifício Central.">
                <input
                  className={inputClass}
                  value={address.placeName}
                  onChange={(e) => update("placeName", e.target.value)}
                  autoComplete="organization"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
                <Field label="CEP" hint={cepStatus || undefined}>
                  <div className="relative">
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="00000-000"
                      value={formatCep(address.cep)}
                      onChange={(e) => {
                        const cep = normalizeCep(e.target.value);
                        update("cep", cep);
                        if (cep.length === 8) lookupCep(cep);
                      }}
                    />
                    {lookingUp ? (
                      <Loader2 className="absolute right-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 animate-spin text-graphite/40" />
                    ) : null}
                  </div>
                </Field>
                <Field label="Rua / avenida">
                  <input
                    className={inputClass}
                    value={address.street}
                    onChange={(e) => update("street", e.target.value)}
                    autoComplete="address-line1"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,8rem)_minmax(0,1fr)]">
                <Field label="Número">
                  <input
                    id="clinic-number"
                    className={inputClass}
                    value={address.number}
                    onChange={(e) => update("number", e.target.value)}
                  />
                </Field>
                <Field label="Complemento" hint="Sala, andar, bloco…">
                  <input
                    className={inputClass}
                    value={address.complement}
                    onChange={(e) => update("complement", e.target.value)}
                    autoComplete="address-line2"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,5rem)]">
                <Field label="Bairro">
                  <input className={inputClass} value={address.district} onChange={(e) => update("district", e.target.value)} />
                </Field>
                <Field label="Cidade">
                  <input
                    className={inputClass}
                    value={address.city}
                    onChange={(e) => update("city", e.target.value)}
                    autoComplete="address-level2"
                  />
                </Field>
                <Field label="UF">
                  <input
                    className={inputClass}
                    maxLength={2}
                    value={address.state}
                    onChange={(e) => update("state", e.target.value.toUpperCase())}
                    autoComplete="address-level1"
                  />
                </Field>
              </div>

              <button type="submit" disabled={saving || !complete} className={btnPrimary()}>
                {saving ? "Salvando…" : "Salvar endereço"}
              </button>
            </form>
          )}
        </Card>

        <Card className="overflow-hidden p-0 sm:p-0">
          <div className="flex items-start gap-3 border-b border-olive-900/10 px-5 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-olive-100 text-olive-800">
              <MapPin className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-graphite">Como o paciente vai ver</h2>
              <p className="mt-0.5 break-words text-sm text-graphite/60">
                {complete ? formatAddress(address) : "Preencha o endereço para ver no mapa."}
              </p>
              {complete ? (
                <a
                  href={googleMapsLink(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-olive-800 hover:underline"
                >
                  Abrir no Google Maps <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
          {embedUrl ? (
            <iframe
              key={embedUrl}
              title="Mapa do endereço de atendimento"
              src={embedUrl}
              className="block h-80 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="flex h-80 items-center justify-center bg-linen/50 text-sm text-graphite/40">
              O mapa aparece aqui
            </div>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
