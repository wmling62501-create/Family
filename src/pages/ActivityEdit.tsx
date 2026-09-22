import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { ActivityForm } from "@/components/activities/activity-form";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PageLoader } from "@/components/common/page-loader";
import { Button } from "@/components/ui/button";
import { useActivity } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";

const ActivityEdit = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { data: activity, isLoading } = useActivity(id);

  if (isLoading) return <PageLoader />;

  if (!activity) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t("activities.detail.notFound")}
        action={
          <Button asChild variant="outline">
            <Link to="/activities">{t("common.back")}</Link>
          </Button>
        }
      />
    );
  }

  if (!isAdmin && activity.created_by !== user?.id) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t("admin.guard.denied")}
        hint={t("admin.guard.deniedHint")}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("nav.activities")}
        title={t("activities.form.editTitle")}
        subtitle={t("activities.form.editSubtitle")}
      />
      <ActivityForm activity={activity} />
    </div>
  );
};

export default ActivityEdit;
