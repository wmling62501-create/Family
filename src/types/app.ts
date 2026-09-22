import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type ActivityPhoto = Database["public"]["Tables"]["activity_photos"]["Row"];
export type ActivityParticipant =
  Database["public"]["Tables"]["activity_participants"]["Row"];
export type InviteCode = Database["public"]["Tables"]["invite_codes"]["Row"];

export type ActivityWithDetails = Activity & {
  photos: ActivityPhoto[];
  participants: ActivityParticipant[];
};

export type RsvpStatus = ActivityParticipant["status"];

/** Result shape returned by the invite-code RPCs. */
export type InviteCodeResult = {
  valid?: boolean;
  ok?: boolean;
  reason?: string;
  role?: string;
};
