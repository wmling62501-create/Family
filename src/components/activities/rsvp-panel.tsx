import { useState } from "react";
import { Check, Loader2, UserCheck, UserX, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDeleteParticipant,
  useUpsertParticipant,
} from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { useRsvpStatusLabels } from "@/hooks/use-labels";
import { cn } from "@/lib/utils";
import type {
  ActivityParticipant,
  FamilyMember,
  RsvpStatus,
} from "@/types/app";

type RsvpPanelProps = {
  activityId: string;
  participants: ActivityParticipant[];
  members: FamilyMember[];
};

export const RsvpPanel = ({
  activityId,
  participants,
  members,
}: RsvpPanelProps) => {
  const { t } = useTranslation();
  const statusLabels = useRsvpStatusLabels();
  const { user, profile, isAdmin } = useAuth();
  const upsertParticipant = useUpsertParticipant();
  const deleteParticipant = useDeleteParticipant();

  const [memberId, setMemberId] = useState<string>(
    profile?.family_member_id ?? "",
  );
  const [status, setStatus] = useState<RsvpStatus>("attending");
  const [guestCount, setGuestCount] = useState("1");
  const [note, setNote] = useState("");

  const memberName = (id: string) =>
    members.find((member) => member.id === id)?.full_name ?? t("common.unknown");

  const attending = participants.filter(
    (participant) => participant.status === "attending",
  );
  const totalGuests = attending.reduce(
    (sum, participant) => sum + participant.guest_count,
    0,
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!memberId) {
      toast.error(t("rsvp.errorMember"));
      return;
    }

    const parsedGuests = Number.parseInt(guestCount, 10);

    try {
      await upsertParticipant.mutateAsync({
        activityId,
        familyMemberId: memberId,
        status,
        guestCount: Number.isNaN(parsedGuests) ? 1 : Math.min(Math.max(parsedGuests, 0), 99),
        note: note.trim() ? note.trim() : null,
      });
      setNote("");
      toast.success(t("rsvp.success"));
    } catch (error) {
      console.error("Failed to save sign-up", error);
      toast.error(t("common.error"));
    }
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-lg">{t("rsvp.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("rsvp.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-md bg-accent/60 px-4 py-3 text-sm text-accent-foreground">
          {participants.length === 0
            ? t("rsvp.empty")
            : t("rsvp.summary", {
                attending: attending.length,
                guests: totalGuests,
              })}
        </div>

        {participants.length > 0 ? (
          <ul className="space-y-2">
            {participants.map((participant) => (
              <li
                key={participant.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/70 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {memberName(participant.family_member_id)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {statusLabels[participant.status]} ·{" "}
                    {t("rsvp.guestCount")} {participant.guest_count}
                    {participant.note ? ` · ${participant.note}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full",
                      participant.status === "attending"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {participant.status === "attending" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </span>
                  {isAdmin || participant.registered_by === user?.id ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("rsvp.remove")}
                      onClick={() => deleteParticipant.mutate(participant.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-4 border-t border-border/70 pt-5"
        >
          <div className="space-y-2">
            <Label>{t("rsvp.selectMember")}</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger>
                <SelectValue placeholder={t("rsvp.memberPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={status === "attending" ? "default" : "outline"}
              onClick={() => setStatus("attending")}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              {t("rsvp.attending")}
            </Button>
            <Button
              type="button"
              variant={status === "declined" ? "default" : "outline"}
              onClick={() => setStatus("declined")}
            >
              <UserX className="mr-2 h-4 w-4" />
              {t("rsvp.declined")}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rsvp-guests">{t("rsvp.guestCount")}</Label>
              <Input
                id="rsvp-guests"
                type="number"
                min={0}
                max={99}
                value={guestCount}
                onChange={(event) => setGuestCount(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rsvp-note">{t("rsvp.note")}</Label>
              <Input
                id="rsvp-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("rsvp.notePlaceholder")}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={upsertParticipant.isPending}
          >
            {upsertParticipant.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t("rsvp.register")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
