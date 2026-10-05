import { useState } from "react";
import { Heart, KeyRound, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, session, passwordRecovery, updatePassword, signOut } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);

  // A valid recovery link always establishes a session before this page renders;
  // an expired or reused link arrives with none.
  const hasRecoverySession = Boolean(session ?? user) || passwordRecovery;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmation) {
      toast.error(t("auth.error.passwordMismatch"));
      return;
    }

    setPending(true);
    const error = await updatePassword(password);
    setPending(false);

    if (error) {
      toast.error(
        error === "shortPassword"
          ? t("auth.error.shortPassword")
          : t("common.error"),
      );
      return;
    }

    toast.success(t("auth.update.success"));
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col surface-warm">
      <div className="flex items-center justify-between px-5 py-5 md:px-8">
        <span className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-warm text-primary-foreground shadow-elegant">
            <Heart className="h-4 w-4" />
          </span>
          {t("common.appName")}
        </span>
        <LanguageSwitcher className="min-w-[130px]" />
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-16">
        <Card className="w-full max-w-md border-border/80 shadow-elegant">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="font-display text-2xl">
              {t("auth.update.title")}
            </CardTitle>
            <CardDescription>
              {hasRecoverySession
                ? t("auth.update.hint")
                : t("auth.update.invalidLink")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {hasRecoverySession ? (
              <form
                onSubmit={(event) => {
                  void handleSubmit(event);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="new-password">
                    {t("auth.update.newPassword")}
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("auth.passwordPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    {t("auth.update.confirmPassword")}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder={t("auth.passwordPlaceholder")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  {t("auth.update.submit")}
                </Button>
              </form>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">{t("auth.reset.backToSignIn")}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
