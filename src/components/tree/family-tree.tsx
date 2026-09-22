import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { flattenTree, type FamilyTreeNode } from "@/lib/family-tree";
import { formatYear } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FamilyMember } from "@/types/app";

type FamilyTreeProps = {
  nodes: FamilyTreeNode[];
};

const MemberChip = ({
  member,
  spouse = false,
}: {
  member: FamilyMember;
  spouse?: boolean;
}) => (
  <Link
    to={`/members/${member.id}`}
    className={cn(
      "flex items-center gap-3 rounded-full border px-3 py-2 transition-smooth hover:-translate-y-0.5 hover:shadow-elegant",
      spouse
        ? "border-dashed border-border bg-secondary/60"
        : "border-border bg-card shadow-sm hover:border-primary/40",
    )}
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-warm text-sm font-semibold text-primary-foreground">
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
    <span className="min-w-0">
      <span className="block truncate text-sm font-medium text-foreground">
        {member.full_name}
      </span>
      <span className="block text-xs text-muted-foreground">
        {formatYear(member.birth_date) ?? "—"}
      </span>
    </span>
  </Link>
);

const TreeBranch = ({
  nodes,
  collapsed,
  onToggle,
}: FamilyTreeProps & {
  collapsed: Set<string>;
  onToggle: (memberId: string) => void;
}) => {
  const { t } = useTranslation();

  return (
    <ul className="space-y-4">
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isCollapsed = collapsed.has(node.member.id);

        return (
          <li key={node.member.id}>
            <div className="flex flex-wrap items-center gap-2">
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={
                    isCollapsed ? t("tree.expandAll") : t("tree.collapseAll")
                  }
                  onClick={() => onToggle(node.member.id)}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <span className="h-7 w-7" />
              )}

              <MemberChip member={node.member} />

              {node.spouse ? (
                <>
                  <Heart className="h-4 w-4 text-primary" />
                  <span className="sr-only">
                    {t("tree.spouseOf", { name: node.member.full_name })}
                  </span>
                  <MemberChip member={node.spouse} spouse />
                </>
              ) : null}
            </div>

            {hasChildren && !isCollapsed ? (
              <div className="ml-3.5 mt-3 border-l border-dashed border-border pl-5">
                <TreeBranch
                  nodes={node.children}
                  collapsed={collapsed}
                  onToggle={onToggle}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
};

export const FamilyTree = ({ nodes }: FamilyTreeProps) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const allIds = useMemo(
    () => flattenTree(nodes).map((node) => node.member.id),
    [nodes],
  );

  const toggle = (memberId: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t("tree.legend")}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCollapsed(new Set())}
          >
            {t("tree.expandAll")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCollapsed(new Set(allIds))}
          >
            {t("tree.collapseAll")}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card/60 p-5 shadow-sm md:p-8">
        <TreeBranch nodes={nodes} collapsed={collapsed} onToggle={toggle} />
      </div>
    </div>
  );
};
