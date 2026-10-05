import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";

/**
 * The password-recovery link may land on the site root when the redirect path
 * is not allow-listed, leaving the visitor signed in mid-recovery. Send them to
 * the page where they can set a new password.
 */
export const RecoveryRedirect = () => {
  const { passwordRecovery } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (passwordRecovery && location.pathname !== "/reset-password") {
      navigate("/reset-password", { replace: true });
    }
  }, [location.pathname, navigate, passwordRecovery]);

  return null;
};
