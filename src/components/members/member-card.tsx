import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useGenderLabels } from "@/hooks/use-labels";
import { formatYear } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Gender } from "@/lib/constants";
import type { FamilyMember } from "@/types/app";

type MemberCardProps = {
  member: FamilyMember;
  caption?: string;
  className?: string;
};

export const MemberCard = ({ member, caption, className }: MemberCardProps) => {
  const { t } = useTranslation();
  const genderLabels = useGenderLabels();
  const birthYear = formatYear(member.birth_date);
  const meta = [
    birthYear,
    genderLabels[member.gender as Gender],
    member.death_date ? t("members.detail.deceased") : null,
  ].filter(Boolean);

  return (
    <Link
      to={`/members/${member.id}`}
      className={cn(
        "group flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm transition-smooth hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant",
        className,
      )}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-warm text-lg font-semibold text-primary-foreground">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.full_name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          member.full_name.slice(0, 1)
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-base font-semibold text-foreground group-hover:text-primary">
          {member.full_name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {caption ?? meta.join(" · ")}
        </span>
      </span>
    </Link>
  );
};
