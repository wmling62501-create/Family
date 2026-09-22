import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { FamilyMember } from "@/types/app";

export const FAMILY_MEMBERS_KEY = ["family-members"] as const;

export type FamilyMemberInput = {
  full_name: string;
  gender: FamilyMember["gender"];
  birth_date: string | null;
  death_date: string | null;
  parent_id: string | null;
  spouse_id: string | null;
  photo_url: string | null;
  bio: string | null;
  sort_order?: number;
};

export const useFamilyMembers = () =>
  useQuery({
    queryKey: FAMILY_MEMBERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("birth_date", { ascending: true, nullsFirst: true })
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as FamilyMember[];
    },
  });

/** Keep `spouse_id` symmetric on both member rows. */
const syncSpouse = async (
  memberId: string,
  nextSpouseId: string | null,
  previousSpouseId: string | null,
) => {
  if (nextSpouseId) {
    const { error } = await supabase
      .from("family_members")
      .update({ spouse_id: memberId })
      .eq("id", nextSpouseId);
    if (error) console.error("Failed to link spouse", error.message);
  }

  if (previousSpouseId && previousSpouseId !== nextSpouseId) {
    const { error } = await supabase
      .from("family_members")
      .update({ spouse_id: null })
      .eq("id", previousSpouseId)
      .eq("spouse_id", memberId);
    if (error) console.error("Failed to unlink spouse", error.message);
  }
};

export const useCreateFamilyMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FamilyMemberInput) => {
      const { data, error } = await supabase
        .from("family_members")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      if (input.spouse_id) await syncSpouse(data.id, input.spouse_id, null);
      return data as FamilyMember;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FAMILY_MEMBERS_KEY });
    },
  });
};

export const useUpdateFamilyMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
      previousSpouseId,
    }: {
      id: string;
      input: FamilyMemberInput;
      previousSpouseId: string | null;
    }) => {
      const { data, error } = await supabase
        .from("family_members")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      await syncSpouse(id, input.spouse_id, previousSpouseId);
      return data as FamilyMember;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FAMILY_MEMBERS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
};

export const useDeleteFamilyMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FAMILY_MEMBERS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
};
