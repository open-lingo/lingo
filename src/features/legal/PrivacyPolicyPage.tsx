import { LegalDocumentView } from "./LegalDocumentView";
import { LEGAL_DOCUMENTS } from "./legalDocuments";

export function PrivacyPolicyPage() {
  return <LegalDocumentView doc={LEGAL_DOCUMENTS.privacy} />;
}
