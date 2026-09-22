import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type {
  ActivityParticipant,
  ActivityWithDetails,
  RsvpStatus,
} from "@/types/app";
import { FAMILY_MEMBERS_KEY } from "@/hooks/use-members";

export const ACTIVITIES_KEY = ["activities"] as const;

export type ActivityInput = {
  title: string;
  description: string | null;
  activity_date: string;
  location: string | null;
  category: string;
  photoUrls: string[];
  participantIds: string[];
};

const selectActivities = async () => {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("activity_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

const loadDetails = async (activityIds: string[]) => {
  if (activityIds.length === 0) {
    return { photos: [], participants: [] };
  }

  const [photosResult, participantsResult] = await Promise.all([
    supabase
      .from("activity_photos")
      .select("*")
      .in("activity_id", activityIds)
      .order("sort_order", { ascending: true }),
    supabase
      .from("activity_participants")
      .select("*")
      .in("activity_id", activityIds),
  ]);

  if (photosResult.error) throw photosResult.error;
  if (participantsResult.error) throw participantsResult.error;

  return {
    photos: photosResult.data ?? [],
    participants: participantsResult.data ?? [],
  };
};

export const useActivities = () =>
  useQuery({
    queryKey: ACTIVITIES_KEY,
    queryFn: async (): Promise<ActivityWithDetails[]> => {
      const activities = await selectActivities();
      const { photos, participants } = await loadDetails(
        activities.map((activity) => activity.id),
      );

      return activities.map((activity) => ({
        ...activity,
        photos: photos.filter((photo) => photo.activity_id === activity.id),
        participants: participants.filter(
          (participant) => participant.activity_id === activity.id,
        ),
      }));
    },
  });

export const useActivity = (activityId?: string) =>
  useQuery({
    queryKey: [...ACTIVITIES_KEY, activityId],
    enabled: Boolean(activityId),
    queryFn: async (): Promise<ActivityWithDetails | null> => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("id", activityId as string)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const { photos, participants } = await loadDetails([data.id]);
      return { ...data, photos, participants };
    },
  });

export const useCreateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ActivityInput) => {
      const { data, error } = await supabase
        .from("activities")
        .insert({
          title: input.title,
          description: input.description,
          activity_date: input.activity_date,
          location: input.location,
          category: input.category,
          cover_image_url: input.photoUrls[0] ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      if (input.photoUrls.length > 0) {
        const { error: photoError } = await supabase
          .from("activity_photos")
          .insert(
            input.photoUrls.map((url, index) => ({
              activity_id: data.id,
              image_url: url,
              sort_order: index,
            })),
          );
        if (photoError) throw photoError;
      }

      if (input.participantIds.length > 0) {
        const { error: participantError } = await supabase
          .from("activity_participants")
          .insert(
            input.participantIds.map((memberId) => ({
              activity_id: data.id,
              family_member_id: memberId,
              status: "attending" as const,
              guest_count: 1,
            })),
          );
        if (participantError) throw participantError;
      }

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY });
    },
  });
};

export type ActivityUpdateInput = {
  id: string;
  title: string;
  description: string | null;
  activity_date: string;
  location: string | null;
  category: string;
  /** Final ordered photo URLs, as edited in the form. */
  photoUrls: string[];
  /** Photos already stored for this activity, used to diff. */
  originalPhotos: { id: string; image_url: string }[];
};

export const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ActivityUpdateInput) => {
      const { error: activityError } = await supabase
        .from("activities")
        .update({
          title: input.title,
          description: input.description,
          activity_date: input.activity_date,
          location: input.location,
          category: input.category,
          cover_image_url: input.photoUrls[0] ?? null,
        })
        .eq("id", input.id);

      if (activityError) throw activityError;

      const keptIds = new Map(
        input.originalPhotos.map((photo) => [photo.image_url, photo.id]),
      );
      const removedIds = input.originalPhotos
        .filter((photo) => !input.photoUrls.includes(photo.image_url))
        .map((photo) => photo.id);

      if (removedIds.length > 0) {
        const { error } = await supabase
          .from("activity_photos")
          .delete()
          .in("id", removedIds);
        if (error) throw error;
      }

      const addedUrls = input.photoUrls.filter((url) => !keptIds.has(url));
      const rows: { id: string; sort_order: number }[] = input.photoUrls
        .map((url, index) => {
          const id = keptIds.get(url);
          return id ? { id, sort_order: index } : null;
        })
        .filter((row): row is { id: string; sort_order: number } => row !== null);

      if (addedUrls.length > 0) {
        const { data: inserted, error } = await supabase
          .from("activity_photos")
          .insert(
            addedUrls.map((url, index) => ({
              activity_id: input.id,
              image_url: url,
              sort_order: input.originalPhotos.length + index,
            })),
          )
          .select("id, image_url");

        if (error) throw error;

        input.photoUrls.forEach((url, index) => {
          const match = inserted?.find((photo) => photo.image_url === url);
          if (match) rows.push({ id: match.id, sort_order: index });
        });
      }

      if (rows.length > 0) {
        const { error } = await supabase
          .from("activity_photos")
          .upsert(rows, { onConflict: "id" });
        if (error) throw error;
      }

      return input.id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY });
    },
  });
};

export const useDeleteActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", activityId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY });
    },
  });
};

export type ParticipantInput = {
  activityId: string;
  familyMemberId: string;
  status: RsvpStatus;
  guestCount: number;
  note: string | null;
};

export const useUpsertParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ParticipantInput) => {
      const { error } = await supabase.from("activity_participants").upsert(
        {
          activity_id: input.activityId,
          family_member_id: input.familyMemberId,
          status: input.status,
          guest_count: input.guestCount,
          note: input.note,
        },
        { onConflict: "activity_id,family_member_id" },
      );

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY });
      void queryClient.invalidateQueries({ queryKey: FAMILY_MEMBERS_KEY });
    },
  });
};

export const useDeleteParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase
        .from("activity_participants")
        .delete()
        .eq("id", participantId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY });
      void queryClient.invalidateQueries({ queryKey: FAMILY_MEMBERS_KEY });
    },
  });
};

export type { ActivityParticipant };
