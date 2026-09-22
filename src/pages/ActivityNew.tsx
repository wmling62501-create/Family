import { useTranslation } from "react-i18next";

import { ActivityForm } from "@/components/activities/activity-form";
import { PageHeader } from "@/components/common/page-header";

const ActivityNew = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("nav.activities")}
        title={t("activities.form.title")}
        subtitle={t("activities.form.subtitle")}
      />
      <ActivityForm />
    </div>
  );
};

export default ActivityNew;
