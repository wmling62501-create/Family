import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export const PageLoader = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">{t("common.loading")}</p>
    </div>
  );
};
