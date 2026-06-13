import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import { CenteredLoader } from "@/shared/components/ui/CenteredLoader";

export function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    login();
  }, [login, isLoading, isAuthenticated]);

  if (isLoading) {
    return <CenteredLoader py="lg" message="Redirecting to login..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <CenteredLoader py="lg" message="Redirecting to login..." />;
}
