import { Suspense } from "react";
import IntegracoesPage from "./IntegracoesClient";

export default function Page() {
  return (
    <Suspense>
      <IntegracoesPage />
    </Suspense>
  );
}
