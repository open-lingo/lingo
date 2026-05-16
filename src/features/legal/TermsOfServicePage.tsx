import { LegalDocumentView } from "./LegalDocumentView";
import { LEGAL_DOCUMENTS } from "./legalDocuments";

export function TermsOfServicePage() {
  return <LegalDocumentView doc={LEGAL_DOCUMENTS.terms} />;
}
