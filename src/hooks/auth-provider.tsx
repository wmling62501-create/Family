import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  AuthContext,
  type AuthContextValue,
  type AuthErrorCode,
} from "@/hooks/use-auth";
import type { InviteCodeResult, Profile } from "@/types/app";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const codeFromReason = (reason?: string): AuthErrorCode => {
  switch (reason) {
    case "used":
      return "usedCode";
    case "expired":
      return "expiredCode";
    case "unauthenticated":
      return "unauthenticated";
    case "empty":
    case "not_found":
      return "invalidCode";
    default:
      return "unknown";
  }
};

const codeFromMessage = (message: string): AuthErrorCode => {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login")) return "invalidCredentials";
  if (normalized.includes("already registered")) return "emailTaken";
  if (normalized.includes("at least 6")) return "shortPassword";
  return "unknown";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load profile", error.message);
      return;
    }
    setProfile(data ?? null);
  }, []);

  useEffect(() => {
    let active = true;

    // Register the listener before restoring the session, otherwise the initial
    // restore can fire before anyone is listening.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          // Deferred: calling the client inside the callback deadlocks it.
          setTimeout(() => {
            if (active) void loadProfile(nextSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      },
    );

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) void loadProfile(data.session.user.id);
      setLoading(false);
    });

    void supabase.rpc("bootstrap_status").then(({ data }) => {
      if (!active || !data) return;
      setNeedsBootstrap(
        (data as { needs_bootstrap?: boolean }).needs_bootstrap === true,
      );
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async ({ email, password }) => {
      if (!EMAIL_PATTERN.test(email.trim())) return "invalidEmail";

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) return codeFromMessage(error.message);

      const { data } = await supabase.auth.getUser();
      if (data.user) await loadProfile(data.user.id);
      return null;
    },
    [loadProfile],
  );

  const redeemInviteCode = useCallback<AuthContextValue["redeemInviteCode"]>(
    async (code) => {
      const { data, error } = await supabase.rpc("redeem_invite_code", {
        p_code: code.trim(),
      });

      if (error) return codeFromMessage(error.message);

      const result = (data ?? {}) as InviteCodeResult;
      if (!result.ok) return codeFromReason(result.reason);

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) await loadProfile(userData.user.id);
      return null;
    },
    [loadProfile],
  );

  const signUpWithInvite = useCallback<AuthContextValue["signUpWithInvite"]>(
    async ({ email, password, displayName, inviteCode }) => {
      if (!EMAIL_PATTERN.test(email.trim())) return "invalidEmail";
      if (!displayName.trim()) return "missingName";
      if (password.length < 6) return "shortPassword";

      const code = inviteCode.trim();

      if (!needsBootstrap) {
        const { data, error } = await supabase.rpc("validate_invite_code", {
          p_code: code,
        });
        if (error) return codeFromMessage(error.message);

        const result = (data ?? {}) as InviteCodeResult;
        if (!result.valid) return codeFromReason(result.reason);
      }

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName.trim() },
          },
        });

      if (signUpError) return codeFromMessage(signUpError.message);

      let nextSession = signUpData.session;
      if (!nextSession) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
        if (signInError) return codeFromMessage(signInError.message);
        nextSession = signInData.session;
      }

      // The very first account becomes the admin through the signup trigger and
      // needs no invite code.
      if (nextSession && !needsBootstrap) {
        const { data: redeemData, error: redeemError } = await supabase.rpc(
          "redeem_invite_code",
          { p_code: code },
        );
        if (redeemError) return codeFromMessage(redeemError.message);

        const result = (redeemData ?? {}) as InviteCodeResult;
        if (!result.ok) return codeFromReason(result.reason);
      }

      if (nextSession?.user) await loadProfile(nextSession.user.id);
      return null;
    },
    [loadProfile, needsBootstrap],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      isAdmin: profile?.role === "admin" && profile?.is_approved === true,
      isApproved: profile?.is_approved === true,
      needsBootstrap,
      signIn,
      signUpWithInvite,
      redeemInviteCode,
      signOut,
    }),
    [
      loading,
      needsBootstrap,
      profile,
      redeemInviteCode,
      session,
      signIn,
      signOut,
      signUpWithInvite,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
