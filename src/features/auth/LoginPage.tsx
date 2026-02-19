import { useEffect } from "react";
import { useAuth } from "@/shared/auth/useAuth";

export function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      window.location.href = "/";
      return;
    }
    login();
  }, [login, isLoading, isAuthenticated]);

  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-gray-500">Redirecting to login...</p>
    </div>
  );
}
