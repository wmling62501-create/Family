import { CalendarDays, Camera, MapPin, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { CategoryBadge } from "@/components/common/category-badge";
import type { ActivityCategory } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityWithDetails } from "@/types/app";

type ActivityCardProps = {
  activity: ActivityWithDetails;
  className?: string;
};

export const ActivityCard = ({ activity, className }: ActivityCardProps) => {
  const { t } = useTranslation();
  const date = formatDate(activity.activity_date);
  const cover = activity.cover_image_url ?? activity.photos[0]?.image_url;

  return (
    <Link
      to={`/activities/${activity.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-smooth hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-warm">
        {cover ? (
          <img
            src={cover}
            alt={t("activities.detail.photoAlt")}
            loading="lazy"
            className="h-full w-full object-cover transition-smooth group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-primary-foreground/80">
            <Camera className="h-8 w-8" />
          </span>
        )}
        <span className="absolute left-3 top-3">
          <CategoryBadge
            category={activity.category as ActivityCategory}
            className="border-card/60 bg-card/90 backdrop-blur"
          />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {date}
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
          {activity.title}
        </h3>
        {activity.location ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {activity.location}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5" />
            {t("activities.photoCount", { n: activity.photos.length })}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {t("activities.participantCount", {
              n: activity.participants.length,
            })}
          </span>
        </div>
      </div>
    </Link>
  );
};
