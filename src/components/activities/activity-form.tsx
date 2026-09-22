import { useState } from "react";
import { CalendarDays, Loader2, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { PhotoUploader } from "@/components/activities/photo-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateActivity, useUpdateActivity } from "@/hooks/use-activities";
import { useCategoryLabels } from "@/hooks/use-labels";
import { useFamilyMembers } from "@/hooks/use-members";
import { ACTIVITY_CATEGORIES, type ActivityCategory } from "@/lib/constants";
import type { ActivityWithDetails } from "@/types/app";

const today = () => new Date().toISOString().slice(0, 10);

type ActivityFormProps = {
  /** Pass an activity to edit it; omit to create a new one. */
  activity?: ActivityWithDetails;
};

export const ActivityForm = ({ activity }: ActivityFormProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const categoryLabels = useCategoryLabels();
  const { data: members = [] } = useFamilyMembers();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const isEdit = Boolean(activity);

  const [title, setTitle] = useState(activity?.title ?? "");
  const [activityDate, setActivityDate] = useState(
    activity?.activity_date ?? today(),
  );
  const [category, setCategory] = useState<ActivityCategory>(
    (activity?.category as ActivityCategory) ?? "gathering",
  );
  const [location, setLocation] = useState(activity?.location ?? "");
  const [description, setDescription] = useState(activity?.description ?? "");
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    activity?.photos.map((photo) => photo.image_url) ?? [],
  );
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  const attendingMembers = (activity?.participants ?? []).filter(
    (participant) => participant.status === "attending",
  );

  const toggleParticipant = (memberId: string) => {
    setParticipantIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error(t("activities.form.errorTitle"));
      return;
    }
    if (!activityDate) {
      toast.error(t("activities.form.errorDate"));
      return;
    }

    try {
      if (activity) {
        await updateActivity.mutateAsync({
          id: activity.id,
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          activity_date: activityDate,
          location: location.trim() ? location.trim() : null,
          category,
          photoUrls,
          originalPhotos: activity.photos.map((photo) => ({
            id: photo.id,
            image_url: photo.image_url,
          })),
        });

        toast.success(t("activities.form.successEdit"));
        navigate(`/activities/${activity.id}`);
        return;
      }

      const created = await createActivity.mutateAsync({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        activity_date: activityDate,
        location: location.trim() ? location.trim() : null,
        category,
        photoUrls,
        participantIds,
      });

      toast.success(t("activities.form.success"));
      navigate(`/activities/${created.id}`);
    } catch (error) {
      console.error("Failed to save activity", error);
      toast.error(t("common.error"));
    }
  };

  const isPending = createActivity.isPending || updateActivity.isPending;

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
    >
      <div className="space-y-6">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              {t("activities.form.subtitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="activity-title">
                {t("activities.form.fieldTitle")}
              </Label>
              <Input
                id="activity-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("activities.form.titlePlaceholder")}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="activity-date">
                  {t("activities.form.date")}
                </Label>
                <Input
                  id="activity-date"
                  type="date"
                  value={activityDate}
                  onChange={(event) => setActivityDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("activities.form.category")}</Label>
                <Select
                  value={category}
                  onValueChange={(value) =>
                    setCategory(value as ActivityCategory)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_CATEGORIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {categoryLabels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-location">
                {t("activities.form.location")}
              </Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="activity-location"
                  className="pl-9"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder={t("activities.form.locationPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-description">
                {t("activities.form.description")}
              </Label>
              <Textarea
                id="activity-description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("activities.form.descriptionPlaceholder")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              {t("activities.form.photos")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoUploader
              value={photoUrls}
              onChange={setPhotoUrls}
              folder="activities"
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              {t("activities.form.participants")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? t("activities.form.participantsLocked")
                : t("activities.form.participantsHint")}
            </p>

            {isEdit ? (
              attendingMembers.length === 0 ? (
                <p className="rounded-md bg-secondary/70 px-3 py-2 text-sm text-muted-foreground">
                  {t("rsvp.empty")}
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {attendingMembers.map((participant) => (
                    <li
                      key={participant.id}
                      className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
                    >
                      {members.find(
                        (member) =>
                          member.id === participant.family_member_id,
                      )?.full_name ?? t("common.unknown")}
                    </li>
                  ))}
                </ul>
              )
            ) : members.length === 0 ? (
              <p className="rounded-md bg-secondary/70 px-3 py-2 text-sm text-muted-foreground">
                {t("activities.form.noMembers")}
              </p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {members.map((member) => (
                  <li key={member.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/60">
                      <Checkbox
                        checked={participantIds.includes(member.id)}
                        onCheckedChange={() => toggleParticipant(member.id)}
                      />
                      <span className="text-sm text-foreground">
                        {member.full_name}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CalendarDays className="mr-2 h-4 w-4" />
          )}
          {isEdit
            ? t("activities.form.submitEdit")
            : t("activities.form.submit")}
        </Button>
      </div>
    </form>
  );
};
