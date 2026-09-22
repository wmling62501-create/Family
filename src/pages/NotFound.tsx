import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center surface-warm px-6">
      <div className="space-y-4 text-center">
        <p className="font-display text-5xl font-semibold text-primary">404</p>
        <p className="text-lg text-muted-foreground">{t("notFound.title")}</p>
        <Button asChild variant="outline">
          <Link to="/">{t("notFound.actions.backHome")}</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
