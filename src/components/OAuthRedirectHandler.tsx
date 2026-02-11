import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Handles post-OAuth redirect: when a user completes OAuth sign-in,
 * they land on "/" (the origin). This component detects the pending
 * redirect flag and navigates to /dashboard.
 */
export function OAuthRedirectHandler() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || !user) return;

    const pendingRedirect = sessionStorage.getItem("oauth_pending_redirect");
    if (pendingRedirect) {
      sessionStorage.removeItem("oauth_pending_redirect");
      navigate(pendingRedirect, { replace: true });
      return;
    }

    // Also handle case where user lands on "/" with a fresh session
    // (OAuth callback redirected here) - check if this looks like a fresh OAuth return
    if (location.pathname === "/") {
      const hash = window.location.hash;
      if (hash.includes("access_token") || hash.includes("refresh_token")) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, isLoading, navigate, location.pathname]);

  return null;
}
