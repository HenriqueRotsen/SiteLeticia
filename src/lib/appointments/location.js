// Modalidade da consulta (online / presencial) e endereço de atendimento.

export const MODALITIES = {
  online: { label: "Online", description: "Por vídeo, pelo Google Meet" },
  in_person: { label: "Presencial", description: "No consultório da Letícia" }
};

export function modalityLabel(modality) {
  return (MODALITIES[modality] || MODALITIES.online).label;
}

export function isInPerson(appt) {
  return appt?.modality === "in_person";
}

function clean(value) {
  return String(value ?? "").trim();
}

export function normalizeCep(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 8);
}

export function formatCep(value) {
  const digits = normalizeCep(value);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function sanitizeAddress(input = {}) {
  return {
    placeName: clean(input.placeName).slice(0, 120),
    cep: normalizeCep(input.cep),
    street: clean(input.street).slice(0, 160),
    number: clean(input.number).slice(0, 20),
    complement: clean(input.complement).slice(0, 120),
    district: clean(input.district).slice(0, 120),
    city: clean(input.city).slice(0, 120),
    state: clean(input.state).toUpperCase().slice(0, 2)
  };
}

export function isAddressComplete(address) {
  const a = address || {};
  return Boolean(clean(a.street) && clean(a.number) && clean(a.city) && clean(a.state));
}

// "Rua X, 120 - Sala 3 - Bairro, Cidade - UF, 30100-000"
export function formatAddress(address) {
  if (!address) return "";
  const a = sanitizeAddress(address);
  const line1 = [a.street, a.number].filter(Boolean).join(", ");
  const withComplement = [line1, a.complement].filter(Boolean).join(" - ");
  const cityState = [a.city, a.state].filter(Boolean).join(" - ");
  const parts = [withComplement, a.district, cityState].filter(Boolean).join(", ");
  const withCep = a.cep.length === 8 ? `${parts}, ${formatCep(a.cep)}` : parts;
  return a.placeName ? `${a.placeName} — ${withCep}` : withCep;
}

// Consulta ao Maps sem o nome do local nem o complemento (o Google acha melhor só pelo endereço).
function mapsQuery(addressOrText) {
  if (!addressOrText) return "";
  if (typeof addressOrText === "string") {
    return addressOrText.includes(" — ") ? addressOrText.split(" — ").slice(1).join(" — ") : addressOrText;
  }
  const a = sanitizeAddress(addressOrText);
  return [[a.street, a.number].filter(Boolean).join(", "), a.district, [a.city, a.state].filter(Boolean).join(" - "), formatCep(a.cep)]
    .filter(Boolean)
    .join(", ");
}

export function googleMapsLink(addressOrText) {
  const query = mapsQuery(addressOrText);
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function googleMapsEmbedUrl(addressOrText) {
  const query = mapsQuery(addressOrText);
  if (!query) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}
