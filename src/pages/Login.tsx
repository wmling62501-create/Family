import { useState } from "react";
import { Heart, KeyRound, Loader2, LogIn, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, type AuthErrorCode } from "@/hooks/use-auth";

const errorKeyOf = (code: AuthErrorCode) => {
  switch (code) {
    case "invalidCredentials":
      return "auth.error.invalidCredentials";
    case "emailTaken":
      return "auth.error.emailTaken";
    case "invalidCode":
      return "auth.error.invalidCode";
    case "usedCode":
      return "auth.error.usedCode";
    case "expiredCode":
      return "auth.error.expiredCode";
    case "shortPassword":
      return "auth.error.shortPassword";
    case "invalidEmail":
      return "auth.error.invalidEmail";
    case "missingName":
      return "auth.error.missingName";
    case "passwordMismatch":
      return "auth.error.passwordMismatch";
    case "tooManyRequests":
      return "auth.error.tooManyRequests";
    default:
      return "common.error";
  }
};

const Login = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const {
    user,
    isApproved,
    loading,
    needsBootstrap,
    signIn,
    signUpWithInvite,
    redeemInviteCode,
    sendPasswordReset,
    signOut,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [pending, setPending] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (!loading && user && isApproved) {
    return <Navigate to={from} replace />;
  }

  const reportError = (code: AuthErrorCode) => {
    toast.error(t(errorKeyOf(code)));
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    const error = await signIn({ email, password });
    setPending(false);

    if (error) {
      reportError(error);
      return;
    }
    toast.success(t("auth.signInSuccess"));
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    const error = await signUpWithInvite({
      email,
      password,
      displayName,
      inviteCode,
    });
    setPending(false);

    if (error) {
      reportError(error);
      return;
    }
    toast.success(t("auth.signUpSuccess"));
  };

  const handleRedeem = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    const error = await redeemInviteCode(inviteCode);
    setPending(false);

    if (error) {
      reportError(error);
      return;
    }
    toast.success(t("auth.signUpSuccess"));
  };

  const handleSendReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    const error = await sendPasswordReset(email);
    setPending(false);

    if (error) {
      toast.error(
        error === "tooManyRequests"
          ? t("auth.error.tooManyRequests")
          : error === "invalidEmail"
            ? t("auth.error.invalidEmail")
            : t("auth.reset.error"),
      );
      return;
    }

    setResetSent(true);
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
              {needsBootstrap ? t("auth.bootstrapTitle") : t("auth.title")}
            </CardTitle>
            <CardDescription>
              {needsBootstrap ? t("auth.bootstrapHint") : t("auth.subtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : user && !isApproved ? (
              <form
                onSubmit={(event) => {
                  void handleRedeem(event);
                }}
                className="space-y-4"
              >
                <p className="rounded-md bg-accent/70 px-3 py-2 text-sm text-accent-foreground">
                  {t("auth.pendingApproval")}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="redeem-code">{t("auth.inviteCode")}</Label>
                  <Input
                    id="redeem-code"
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                    placeholder={t("auth.inviteCodePlaceholder")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t("auth.redeemAction")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    void signOut();
                  }}
                >
                  {t("common.logout")}
                </Button>
              </form>
            ) : needsBootstrap ? (
              <form
                onSubmit={(event) => {
                  void handleSignUp(event);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-name">
                    {t("auth.displayName")}
                  </Label>
                  <Input
                    id="bootstrap-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder={t("auth.displayNamePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-email">{t("auth.email")}</Label>
                  <Input
                    id="bootstrap-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t("auth.emailPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-password">
                    {t("auth.password")}
                  </Label>
                  <Input
                    id="bootstrap-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("auth.passwordPlaceholder")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {t("auth.signUpAction")}
                </Button>
              </form>
            ) : showForgot ? (
              <div className="space-y-5">
                <div className="space-y-2 text-center">
                  <p className="font-display text-lg text-foreground">
                    {t("auth.reset.title")}
                  </p>
                  {resetSent ? (
                    <p className="rounded-md bg-accent/70 px-3 py-2 text-sm text-accent-foreground">
                      {t("auth.reset.sent")}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("auth.reset.hint")}
                    </p>
                  )}
                </div>

                {resetSent ? null : (
                  <form
                    onSubmit={(event) => {
                      void handleSendReset(event);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">{t("auth.email")}</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t("auth.emailPlaceholder")}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={pending}>
                      {pending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <KeyRound className="mr-2 h-4 w-4" />
                      )}
                      {pending ? t("auth.reset.sending") : t("auth.reset.send")}
                    </Button>
                  </form>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowForgot(false);
                    setResetSent(false);
                  }}
                >
                  {t("auth.reset.backToSignIn")}
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="signIn">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signIn">{t("auth.signIn")}</TabsTrigger>
                  <TabsTrigger value="signUp">{t("auth.signUp")}</TabsTrigger>
                </TabsList>

                <TabsContent value="signIn" className="mt-5">
                  <form
                    onSubmit={(event) => {
                      void handleSignIn(event);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">{t("auth.email")}</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t("auth.emailPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">
                        {t("auth.password")}
                      </Label>
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={t("auth.passwordPlaceholder")}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={pending}>
                      {pending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogIn className="mr-2 h-4 w-4" />
                      )}
                      {t("auth.signInAction")}
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="w-full"
                      onClick={() => setShowForgot(true)}
                    >
                      {t("auth.forgotPassword")}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signUp" className="mt-5">
                  <form
                    onSubmit={(event) => {
                      void handleSignUp(event);
                    }}
                    className="space-y-4"
                  >
                    <p className="rounded-md bg-accent/70 px-3 py-2 text-xs text-accent-foreground">
                      {t("auth.inviteHint")}
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">
                        {t("auth.displayName")}
                      </Label>
                      <Input
                        id="signup-name"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder={t("auth.displayNamePlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t("auth.email")}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t("auth.emailPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">
                        {t("auth.password")}
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={t("auth.passwordPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-code">{t("auth.inviteCode")}</Label>
                      <Input
                        id="signup-code"
                        value={inviteCode}
                        onChange={(event) => setInviteCode(event.target.value)}
                        placeholder={t("auth.inviteCodePlaceholder")}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={pending}>
                      {pending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      {t("auth.signUpAction")}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
