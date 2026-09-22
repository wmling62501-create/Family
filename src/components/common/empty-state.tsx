import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
};

export const EmptyState = ({
  icon: Icon,
  title,
  hint,
  action,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/60 px-6 py-14 text-center",
      className,
    )}
  >
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
      <Icon className="h-6 w-6" />
    </span>
    <p className="font-display text-lg text-foreground">{title}</p>
    {hint ? (
      <p className="max-w-md text-sm text-muted-foreground">{hint}</p>
    ) : null}
    {action ? <div className="mt-1">{action}</div> : null}
  </div>
);
