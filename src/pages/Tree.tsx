import { useMemo } from "react";
import { GitBranch } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PageLoader } from "@/components/common/page-loader";
import { FamilyTree } from "@/components/tree/family-tree";
import { useFamilyMembers } from "@/hooks/use-members";
import { buildFamilyTree, flattenTree } from "@/lib/family-tree";

const Tree = () => {
  const { t } = useTranslation();
  const { data: members = [], isLoading } = useFamilyMembers();

  const nodes = useMemo(() => buildFamilyTree(members), [members]);
  const total = useMemo(() => flattenTree(nodes).length, [nodes]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("nav.tree")}
        title={t("tree.title")}
        subtitle={t("tree.subtitle")}
      />

      {isLoading ? (
        <PageLoader />
      ) : nodes.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title={t("tree.empty")}
          hint={t("tree.emptyHint")}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t("tree.memberCount", { n: total })}
          </p>
          <FamilyTree nodes={nodes} />
        </>
      )}
    </div>
  );
};

export default Tree;
