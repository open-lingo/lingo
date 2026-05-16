import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";

export function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    login();
  }, [login, isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-gray-500">Redirecting to login...</p>
    </div>
  );
}
