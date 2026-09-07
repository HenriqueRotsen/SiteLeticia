import LegalDocument from "@/components/legal/LegalDocument";
import { legalMeta, termsSections } from "@/lib/legal/content";

export const metadata = {
  title: "Termos | Letícia Cunha",
  description: "Termos de Uso da plataforma de acompanhamento nutricional."
};

export default function TermosPage() {
  return (
    <LegalDocument
      eyebrow="Uso da plataforma"
      title="Termos de Uso"
      intro={`Leia atentamente as condições para utilizar a plataforma de ${legalMeta.controllerName}. O uso responsável dos dados e a segurança da sua conta fazem parte deste acordo.`}
      sections={termsSections}
      relatedHref="/privacidade"
      relatedLabel="Política de Privacidade"
    />
  );
}
