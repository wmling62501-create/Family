import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export const PageHeader = ({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: PageHeaderProps) => (
  <header
    className={cn(
      "flex flex-col gap-4 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between",
      className,
    )}
  >
    <div className="space-y-2">
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
    {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
  </header>
);
