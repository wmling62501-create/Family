import { useState } from "react";
import { Pencil, Plus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { InviteCodeManager } from "@/components/admin/invite-code-manager";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { MemberForm } from "@/components/members/member-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFamilyMembers } from "@/hooks/use-members";
import { formatDate } from "@/lib/format";
import type { FamilyMember } from "@/types/app";

const Admin = () => {
  const { t } = useTranslation();
  const { data: members = [], isLoading } = useFamilyMembers();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (member: FamilyMember) => {
    setEditing(member);
    setFormOpen(true);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("nav.admin")}
        title={t("admin.title")}
        subtitle={t("admin.subtitle")}
      />

      <Tabs defaultValue="invites" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invites">{t("admin.tabs.invites")}</TabsTrigger>
          <TabsTrigger value="members">{t("admin.tabs.members")}</TabsTrigger>
        </TabsList>

        <TabsContent value="invites">
          <InviteCodeManager />
        </TabsContent>

        <TabsContent value="members" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t("admin.members.hint")}
            </p>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("members.new")}
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((key) => (
                <Skeleton key={key} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("members.empty")}
              hint={t("members.emptyHint")}
              action={
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("members.new")}
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {members.map((member) => (
                <li key={member.id}>
                  <Card className="border-border/80 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-warm text-base font-semibold text-primary-foreground">
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
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {member.full_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDate(member.birth_date) ??
                            t("common.emptyValue")}
                          {member.bio ? ` · ${member.bio}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(member)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("common.edit")}
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <MemberForm
        open={formOpen}
        onOpenChange={setFormOpen}
        members={members}
        member={editing}
      />
    </div>
  );
};

export default Admin;
