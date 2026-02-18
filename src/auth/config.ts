/**
 * Auth0 config from environment (Vite env vars).
 * Required for Auth0Provider; set in .env (local) or Amplify env (prod).
 */
function getEnv(name: string): string | undefined {
  return import.meta.env[name] as string | undefined;
}

export const auth0Domain = getEnv("VITE_AUTH0_DOMAIN");
export const auth0ClientId = getEnv("VITE_AUTH0_CLIENT_ID");

export const isAuth0Configured =
  Boolean(auth0Domain && auth0ClientId);

/** Throws if Auth0 env vars are missing (use before rendering Auth0Provider). */
export function requireAuth0Config(): { domain: string; clientId: string } {
  if (!auth0Domain || !auth0ClientId) {
    throw new Error(
      "Auth0 is not configured. Set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in .env (local) or in Amplify environment variables (prod)."
    );
  }
  return { domain: auth0Domain, clientId: auth0ClientId };
}
