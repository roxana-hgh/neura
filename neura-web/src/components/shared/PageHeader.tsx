import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Small uppercase label above the title (the section name) */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Buttons on the right; wraps under the title on small screens */
  actions?: ReactNode;
  className?: string;
}

/** Page title block shared by every page, matching the Habits header. */
function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="truncate text-lg font-semibold tracking-tight md:text-2xl">{title}</h1>
        {description && <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center  gap-y-3 gap-x-1.5">{actions}</div>}
    </div>
  );
}

export default PageHeader;
