import { LegalDocumentView } from "./LegalDocumentView";
import { LEGAL_DOCUMENTS } from "./legalDocuments";

export function AboutPage() {
  return <LegalDocumentView doc={LEGAL_DOCUMENTS.about} />;
}
