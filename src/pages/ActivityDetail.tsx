import { useState } from "react";
import {
  CalendarDays,
  Camera,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { RsvpPanel } from "@/components/activities/rsvp-panel";
import { CategoryBadge } from "@/components/common/category-badge";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoader } from "@/components/common/page-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActivity, useDeleteActivity } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { useFamilyMembers } from "@/hooks/use-members";
import type { ActivityCategory } from "@/lib/constants";
import { formatDate } from "@/lib/format";

const ActivityDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { data: activity, isLoading } = useActivity(id);
  const { data: members = [] } = useFamilyMembers();
  const deleteActivity = useDeleteActivity();
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (isLoading) return <PageLoader />;

  if (!activity) {
    return (
      <EmptyState
        icon={Camera}
        title={t("activities.detail.notFound")}
        action={
          <Button variant="outline" onClick={() => navigate("/activities")}>
            {t("common.back")}
          </Button>
        }
      />
    );
  }

  const canManage = isAdmin || activity.created_by === user?.id;
  const cover = activity.cover_image_url ?? activity.photos[0]?.image_url;

  const handleDelete = async () => {
    if (!window.confirm(t("activities.detail.deleteConfirm"))) return;

    try {
      await deleteActivity.mutateAsync(activity.id);
      toast.success(t("activities.detail.deleteSuccess"));
      navigate("/activities");
    } catch (error) {
      console.error("Failed to delete activity", error);
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <CategoryBadge category={activity.category as ActivityCategory} />
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {formatDate(activity.activity_date)}
          </span>
          {activity.location ? (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {activity.location}
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {activity.title}
          </h1>
          {canManage ? (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to={`/activities/${activity.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("activities.edit")}
                </Link>
              </Button>
              <Button variant="outline" onClick={() => void handleDelete()}>
                <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                {t("common.delete")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {cover ? (
        <div className="overflow-hidden rounded-lg border border-border shadow-elegant">
          <img
            src={cover}
            alt={t("activities.detail.photoAlt")}
            className="max-h-[420px] w-full object-cover"
          />
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          {activity.description ? (
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-lg">
                  {t("activities.detail.about")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                  {activity.description}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("activities.detail.photos")}
            </h2>

            {activity.photos.length === 0 ? (
              <EmptyState
                icon={Camera}
                title={t("activities.detail.noPhotos")}
              />
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {activity.photos.map((photo) => (
                  <li key={photo.id}>
                    <button
                      type="button"
                      onClick={() => setLightbox(photo.image_url)}
                      className="group block h-full w-full overflow-hidden rounded-md border border-border bg-muted"
                    >
                      <img
                        src={photo.image_url}
                        alt={photo.caption ?? t("activities.detail.photoAlt")}
                        loading="lazy"
                        className="aspect-square w-full object-cover transition-smooth group-hover:scale-105"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <RsvpPanel
            activityId={activity.id}
            participants={activity.participants}
            members={members}
          />

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Users className="h-4 w-4 text-primary" />
                {t("activities.detail.participants")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("rsvp.empty")}
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {activity.participants.map((participant) => {
                    const member = members.find(
                      (candidate) =>
                        candidate.id === participant.family_member_id,
                    );
                    return (
                      <li
                        key={participant.id}
                        className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
                      >
                        {member?.full_name ?? t("common.unknown")}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={Boolean(lightbox)}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
      >
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">
            {t("activities.detail.photoViewer")}
          </DialogTitle>
          {lightbox ? (
            <img
              src={lightbox}
              alt={t("activities.detail.photoAlt")}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityDetail;
