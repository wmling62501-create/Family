import { useCategoryLabels } from "@/hooks/use-labels";
import type { ActivityCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";

type CategoryBadgeProps = {
  category: ActivityCategory;
  className?: string;
};

export const CategoryBadge = ({ category, className }: CategoryBadgeProps) => {
  const labels = useCategoryLabels();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary",
        className,
      )}
    >
      {labels[category]}
    </span>
  );
};
