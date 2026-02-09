// MODIFIED BY: final-fix-trips-oauth-driver - reason: Fix OAuth redirect race condition
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

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
  
  // Add a small delay to allow OAuth session to be established
  const [hasWaited, setHasWaited] = useState(false);
  
  useEffect(() => {
    // Give OAuth callback a moment to establish session
    const timer = setTimeout(() => {
      setHasWaited(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading while auth is initializing or we haven't waited yet
  if (isLoading || (!user && !hasWaited)) {
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
