import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

import type { Profile } from "@/types/app";

export type AuthErrorCode =
  | "invalidCredentials"
  | "emailTaken"
  | "invalidCode"
  | "usedCode"
  | "expiredCode"
  | "shortPassword"
  | "invalidEmail"
  | "missingName"
  | "unauthenticated"
  | "unknown";

export type SignInInput = { email: string; password: string };

export type SignUpInput = {
  email: string;
  password: string;
  displayName: string;
  inviteCode: string;
};

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  needsBootstrap: boolean;
  signIn: (input: SignInInput) => Promise<AuthErrorCode | null>;
  signUpWithInvite: (input: SignUpInput) => Promise<AuthErrorCode | null>;
  redeemInviteCode: (code: string) => Promise<AuthErrorCode | null>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};
