import LegalDocument from "@/components/legal/LegalDocument";
import { legalMeta, privacySections } from "@/lib/legal/content";

export const metadata = {
  title: "Privacidade | Letícia Cunha",
  description:
    "Política de Privacidade e tratamento de dados pessoais conforme a LGPD na plataforma de acompanhamento nutricional."
};

export default function PrivacidadePage() {
  return (
    <LegalDocument
      eyebrow="Proteção de dados"
      title="Política de Privacidade"
      intro={`Esta política explica como ${legalMeta.controllerName} trata seus dados pessoais e sensíveis de saúde com transparência, segurança e conformidade com a LGPD.`}
      sections={privacySections}
      relatedHref="/termos"
      relatedLabel="Termos de Uso"
    />
  );
}
