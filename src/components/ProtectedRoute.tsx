import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "passenger" | "driver" | "admin";
  requireApprovedDriver?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requireApprovedDriver = false,
}: ProtectedRouteProps) {
  const { user, isLoading, roles, isApprovedDriver } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireApprovedDriver && !isApprovedDriver) {
    return <Navigate to="/driver/pending" replace />;
  }

  return <>{children}</>;
}
