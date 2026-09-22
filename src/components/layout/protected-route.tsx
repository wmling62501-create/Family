import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageLoader } from "@/components/common/page-loader";
import { useAuth } from "@/hooks/use-auth";

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
};

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) => {
  const { t } = useTranslation();
  const { loading, user, isAdmin, isApproved } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user || !isApproved) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t("admin.guard.denied")}
        hint={t("admin.guard.deniedHint")}
      />
    );
  }

  return <>{children}</>;
};
