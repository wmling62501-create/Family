import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { InviteCode } from "@/types/app";

export const INVITE_CODES_KEY = ["invite-codes"] as const;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateCode = () => {
  const random = new Uint8Array(8);
  crypto.getRandomValues(random);
  const body = Array.from(random, (byte) => CODE_ALPHABET[byte % 32]).join("");
  return `FAMILY-${body}`;
};

export const useInviteCodes = () =>
  useQuery({
    queryKey: INVITE_CODES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invite_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as InviteCode[];
    },
  });

export type CreateInviteCodeInput = {
  role: InviteCode["role"];
  note: string | null;
  expiresAt: string | null;
};

export const useCreateInviteCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInviteCodeInput) => {
      const { data, error } = await supabase
        .from("invite_codes")
        .insert({
          code: generateCode(),
          role: input.role,
          note: input.note,
          expires_at: input.expiresAt,
        })
        .select()
        .single();

      if (error) throw error;
      return data as InviteCode;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVITE_CODES_KEY });
    },
  });
};

export const useDeleteInviteCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCodeId: string) => {
      const { error } = await supabase
        .from("invite_codes")
        .delete()
        .eq("id", inviteCodeId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVITE_CODES_KEY });
    },
  });
};
