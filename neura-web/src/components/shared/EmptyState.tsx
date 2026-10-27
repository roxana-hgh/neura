import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ElementType;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Smaller, borderless version for use inside a card */
  compact?: boolean;
  className?: string;
}

function EmptyState({ icon: Icon, title, description, action, compact, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        compact
          ? "px-4 py-8"
          : "rounded-xl border border-dashed border-border bg-card/50 px-6 py-14",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary/10 text-primary",
          compact ? "size-10" : "size-12"
        )}
      >
        <Icon className={compact ? "size-5" : "size-6"} />
      </div>
      <div>
        <p className={cn("font-medium", compact && "text-sm")}>{title}</p>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default EmptyState;
