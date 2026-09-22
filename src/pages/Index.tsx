import {
  ArrowRight,
  CalendarDays,
  Camera,
  GitBranch,
  Heart,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ActivityCard } from "@/components/activities/activity-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { useFamilyMembers } from "@/hooks/use-members";

const Index = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { data: activities = [], isLoading: activitiesLoading } =
    useActivities();
  const { data: members = [], isLoading: membersLoading } = useFamilyMembers();

  const photoCount = activities.reduce(
    (sum, activity) => sum + activity.photos.length,
    0,
  );
  const recent = activities.slice(0, 3);

  const stats = [
    {
      label: t("home.stats.members"),
      value: members.length,
      icon: Users,
      to: "/members",
    },
    {
      label: t("home.stats.activities"),
      value: activities.length,
      icon: CalendarDays,
      to: "/activities",
    },
    {
      label: t("home.stats.photos"),
      value: photoCount,
      icon: Camera,
      to: "/activities",
    },
  ];

  const quickLinks = [
    {
      to: "/activities/new",
      label: t("home.quick.activities"),
      hint: t("home.quick.activitiesHint"),
      icon: Plus,
    },
    {
      to: "/members",
      label: t("home.quick.members"),
      hint: t("home.quick.membersHint"),
      icon: Users,
    },
    {
      to: "/tree",
      label: t("home.quick.tree"),
      hint: t("home.quick.treeHint"),
      icon: GitBranch,
    },
    {
      to: "/admin",
      label: t("home.quick.admin"),
      hint: t("home.quick.adminHint"),
      icon: Settings,
      adminOnly: true,
    },
  ].filter((link) => !link.adminOnly || isAdmin);

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-lg border border-border/70 bg-gradient-warm px-6 py-12 text-primary-foreground shadow-elegant md:px-12 md:py-16">
        <div className="relative z-10 max-w-2xl space-y-5">
          <span className="inline-flex items-center rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium tracking-wide">
            {t("home.hero.badge")}
          </span>
          <h1 className="font-display text-3xl font-semibold leading-tight md:text-5xl">
            {t("home.hero.title")}
          </h1>
          <p className="text-sm leading-relaxed text-primary-foreground/90 md:text-base">
            {t("home.hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild variant="secondary" size="lg">
              <Link to="/activities">
                {t("home.hero.ctaPrimary")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="hero" size="lg">
              <Link to="/members">{t("home.hero.ctaSecondary")}</Link>
            </Button>
          </div>
        </div>
        <Heart className="pointer-events-none absolute -right-6 -top-6 h-48 w-48 text-primary-foreground/10" />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <Card className="border-border/80 shadow-sm transition-smooth hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
              <CardContent className="flex items-center gap-4 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <stat.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display text-2xl font-semibold text-foreground">
                    {membersLoading || activitiesLoading ? "—" : stat.value}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {t("home.recent.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("home.recent.subtitle")}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/activities">
              {t("home.recent.viewAll")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {activitiesLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={t("home.recent.empty")}
            hint={t("home.recent.emptyHint")}
            action={
              <Button asChild>
                <Link to="/activities/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("home.quick.activities")}
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {recent.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("home.quick.title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group flex items-start gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-smooth hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                <link.icon className="h-5 w-5" />
              </span>
              <span className="space-y-1">
                <span className="block font-display text-base font-semibold text-foreground group-hover:text-primary">
                  {link.label}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {link.hint}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
