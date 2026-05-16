import { Navigate } from "react-router-dom";
import { useLangPath } from "@/shared/hooks/useLangPath";

/** Legacy `/:lang/grammar` → practice hub grammar surface. */
export function GrammarRedirect() {
  const langPath = useLangPath();
  return <Navigate to={langPath("practice/grammar")} replace />;
}
