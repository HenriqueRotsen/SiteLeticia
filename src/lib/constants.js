export const GOALS = [
  "Emagrecimento",
  "Cirurgia Bariátrica",
  "Saúde intestinal",
  "Medicina de precisão",
  "Nutrição clínica",
  "Hipertrofia"
];

export const CONSULTATION_DURATION_MIN = 60;
export const CONSULTATION_BUFFER_MIN = 15;
export const SLOT_INTERVAL_MIN = CONSULTATION_DURATION_MIN + CONSULTATION_BUFFER_MIN;
export const TIMEZONE = "America/Sao_Paulo";

export const PRIVACY_POLICY_VERSION = "1.1";
export const TERMS_VERSION = "1.1";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_CSV_BYTES = 2 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const IMAGE_MAX_SIDE_PX = 1920;
export const IMAGE_WEBP_QUALITY = 82;
export const IMAGE_JPEG_QUALITY = 82;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_PDF_TYPES = ["application/pdf"];
export const ALLOWED_CSV_TYPES = ["text/csv", "application/csv", "text/plain"];
