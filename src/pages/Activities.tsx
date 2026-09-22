import { useMemo, useState } from "react";
import { CalendarDays, Filter, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ActivityCard } from "@/components/activities/activity-card";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/hooks/use-activities";
import { useCategoryLabels } from "@/hooks/use-labels";
import { useFamilyMembers } from "@/hooks/use-members";
import {
  ACTIVITY_CATEGORIES,
  type ActivityCategory,
} from "@/lib/constants";
import { formatYear } from "@/lib/format";

const ALL = "all";

const Activities = () => {
  const { t } = useTranslation();
  const categoryLabels = useCategoryLabels();
  const { data: activities = [], isLoading } = useActivities();
  const { data: members = [] } = useFamilyMembers();

  const [year, setYear] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [memberId, setMemberId] = useState(ALL);

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          activities
            .map((activity) => formatYear(activity.activity_date))
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => (a < b ? 1 : -1)),
    [activities],
  );

  const filtered = activities.filter((activity) => {
    if (year !== ALL && formatYear(activity.activity_date) !== year) {
      return false;
    }
    if (category !== ALL && activity.category !== category) return false;
    if (
      memberId !== ALL &&
      !activity.participants.some(
        (participant) => participant.family_member_id === memberId,
      )
    ) {
      return false;
    }
    return true;
  });

  const hasFilters = year !== ALL || category !== ALL || memberId !== ALL;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("nav.activities")}
        title={t("activities.title")}
        subtitle={t("activities.subtitle")}
        action={
          <Button asChild>
            <Link to="/activities/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("activities.new")}
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
        </span>

        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("activities.filter.allYears")}</SelectItem>
            {years.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              {t("activities.filter.allCategories")}
            </SelectItem>
            {ACTIVITY_CATEGORIES.map((value: ActivityCategory) => (
              <SelectItem key={value} value={value}>
                {categoryLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={memberId} onValueChange={setMemberId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              {t("activities.filter.allMembers")}
            </SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setYear(ALL);
              setCategory(ALL);
              setMemberId(ALL);
            }}
          >
            <X className="mr-2 h-4 w-4" />
            {t("activities.filter.reset")}
          </Button>
        ) : null}

        <span className="ml-auto text-sm text-muted-foreground">
          {t("activities.resultCount", { n: filtered.length })}
        </span>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <Skeleton key={key} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("activities.empty")}
          hint={t("activities.emptyHint")}
          action={
            <Button asChild>
              <Link to="/activities/new">
                <Plus className="mr-2 h-4 w-4" />
                {t("activities.new")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Activities;
