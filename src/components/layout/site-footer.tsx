import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export const SiteFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 border-t border-border/70 bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 py-8 text-center text-sm text-muted-foreground md:px-8">
        <span className="flex items-center gap-2 font-display text-base text-foreground">
          <Heart className="h-4 w-4 text-primary" />
          {t("common.appName")}
        </span>
        <p>{t("common.tagline")}</p>
      </div>
    </footer>
  );
};
