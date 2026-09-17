import { useSearchParams } from "react-router-dom";
import { AuthHandoff, type AuthHandoffDirection } from "@/features/auth/AuthHandoff";

/**
 * Dev-only capture harness for `AuthHandoff`. Not linked from anywhere in
 * the product — this route exists because the real flow cannot render
 * `AuthHandoff` on demand: with the auth bypass ON (how the simulator
 * normally runs), `useAuth()` reports `isAuthenticated: true` before either
 * `LoginPage` or `RootRoute` ever paints a loading frame, and with the
 * bypass OFF the real Auth0 round trip needs live credentials that only
 * exist on Spencer's phone/build. `?direction=opening|signing-in` selects
 * which copy renders; defaults to `opening`.
 *
 * sim:capture usage: `--route "/qa/auth-handoff?direction=opening"` and
 * `--route "/qa/auth-handoff?direction=signing-in"`.
 */
export function AuthHandoffQaPage() {
  const [params] = useSearchParams();
  const direction: AuthHandoffDirection =
    params.get("direction") === "signing-in" ? "signing-in" : "opening";
  return <AuthHandoff direction={direction} />;
}

export default AuthHandoffQaPage;
