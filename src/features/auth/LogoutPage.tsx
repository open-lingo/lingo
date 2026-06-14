import { useEffect } from "react";
import { useAuth } from "@/shared/auth/useAuth";

export function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-text-muted">Logging out...</p>
    </div>
  );
}
