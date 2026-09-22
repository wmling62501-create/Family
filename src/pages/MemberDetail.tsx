import { useState } from "react";
import { CalendarDays, Pencil, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { CategoryBadge } from "@/components/common/category-badge";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoader } from "@/components/common/page-loader";
import { MemberForm } from "@/components/members/member-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivities } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { useGenderLabels } from "@/hooks/use-labels";
import { useFamilyMembers } from "@/hooks/use-members";
import type { ActivityCategory, Gender } from "@/lib/constants";
import { calculateAge, formatDate, formatYear } from "@/lib/format";
import type { FamilyMember } from "@/types/app";

const MemberDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const genderLabels = useGenderLabels();
  const { data: members = [], isLoading } = useFamilyMembers();
  const { data: activities = [] } = useActivities();
  const [formOpen, setFormOpen] = useState(false);

  if (isLoading) return <PageLoader />;

  const member = members.find((candidate) => candidate.id === id);

  if (!member) {
    return (
      <EmptyState
        icon={UserRound}
        title={t("members.detail.notFound")}
        action={
          <Button asChild variant="outline">
            <Link to="/members">{t("common.back")}</Link>
          </Button>
        }
      />
    );
  }

  const parent = members.find(
    (candidate) => candidate.id === member.parent_id,
  );
  const spouse = members.find(
    (candidate) => candidate.id === member.spouse_id,
  );
  const children = members.filter(
    (candidate) => candidate.parent_id === member.id,
  );
  const age = calculateAge(member.birth_date, member.death_date);
  const joined = activities.filter((activity) =>
    activity.participants.some(
      (participant) => participant.family_member_id === member.id,
    ),
  );

  const RelationRow = ({
    label,
    people,
  }: {
    label: string;
    people: FamilyMember[];
  }) => (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {people.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("common.emptyValue")}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {people.map((person) => (
            <li key={person.id}>
              <Link
                to={`/members/${person.id}`}
                className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground transition-colors hover:bg-accent"
              >
                {person.full_name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:p-8">
        <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-warm text-3xl font-semibold text-primary-foreground shadow-elegant">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            member.full_name.slice(0, 1)
          )}
        </span>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              {member.full_name}
            </h1>
            {member.death_date ? (
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {t("members.detail.deceased")}
              </span>
            ) : null}
          </div>

          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">
                {t("members.detail.birthDate")}
              </dt>
              <dd className="text-foreground">
                {formatDate(member.birth_date) ?? t("common.emptyValue")}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">
                {t("members.detail.age")}
              </dt>
              <dd className="text-foreground">
                {age === null
                  ? t("common.emptyValue")
                  : t("members.detail.ageValue", { age })}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">
                {t("members.detail.gender")}
              </dt>
              <dd className="text-foreground">
                {genderLabels[member.gender as Gender]}
              </dd>
            </div>
          </dl>
        </div>

        {isAdmin ? (
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("common.edit")}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              {t("members.detail.bio")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {member.bio ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {member.bio}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("common.emptyValue")}
              </p>
            )}

            <div className="space-y-5 border-t border-border/70 pt-5">
              <RelationRow
                label={t("members.detail.parent")}
                people={parent ? [parent] : []}
              />
              <RelationRow
                label={t("members.detail.spouse")}
                people={spouse ? [spouse] : []}
              />
              <RelationRow
                label={t("members.detail.children")}
                people={children}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <CalendarDays className="h-4 w-4 text-primary" />
              {t("members.detail.activities")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {joined.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("members.detail.noActivities")}
              </p>
            ) : (
              <ul className="space-y-3">
                {joined.map((activity) => (
                  <li key={activity.id}>
                    <Link
                      to={`/activities/${activity.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/70 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/50"
                    >
                      <span className="space-y-1">
                        <span className="block font-medium text-foreground">
                          {activity.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatYear(activity.activity_date)}
                          {activity.location ? ` · ${activity.location}` : ""}
                        </span>
                      </span>
                      <CategoryBadge
                        category={activity.category as ActivityCategory}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <MemberForm
        open={formOpen}
        onOpenChange={setFormOpen}
        members={members}
        member={member}
      />
    </div>
  );
};

export default MemberDetail;
