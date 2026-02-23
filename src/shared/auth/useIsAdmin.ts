import { useAuth } from "./useAuth";

/**
 * Check if the current user has admin access.
 * For now defaults to true when authenticated — RBAC will be added later.
 */
export function useIsAdmin(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
