import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { MemberCard } from "@/components/members/member-card";
import { MemberForm } from "@/components/members/member-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useFamilyMembers } from "@/hooks/use-members";
import { computeGenerations } from "@/lib/family-tree";
import type { FamilyMember } from "@/types/app";

const Members = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { data: members = [], isLoading } = useFamilyMembers();
  const [formOpen, setFormOpen] = useState(false);

  const groups = useMemo(() => {
    const generations = computeGenerations(members);
    const grouped = new Map<number, FamilyMember[]>();

    members.forEach((member) => {
      const depth = generations.get(member.id) ?? 0;
      const bucket = grouped.get(depth) ?? [];
      bucket.push(member);
      grouped.set(depth, bucket);
    });

    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [members]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("nav.members")}
        title={t("members.title")}
        subtitle={t("members.subtitle")}
        action={
          isAdmin ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("members.new")}
            </Button>
          ) : null
        }
      />

      {!isLoading && members.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("members.count", { n: members.length })}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <Skeleton key={key} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("members.empty")}
          hint={t("members.emptyHint")}
          action={
            isAdmin ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("members.new")}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-10">
          {groups.map(([depth, group]) => (
            <section key={depth} className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {t("members.generation", { n: depth + 1 })}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <MemberForm
        open={formOpen}
        onOpenChange={setFormOpen}
        members={members}
      />
    </div>
  );
};

export default Members;
