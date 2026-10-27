import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** Right side of the header (tabs, buttons) */
  action?: ReactNode;
  /** Adds a "View all" link to the header */
  viewAllTo?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** Card with an optional icon + title header. Used for dashboard widgets and content panels. */
function SectionCard({
  icon, title, description, action, viewAllTo, children, className, contentClassName,
}: SectionCardProps) {
  const hasHeader = title || action || viewAllTo;

  return (
    <section className={cn("flex min-w-0 flex-col rounded-xl border border-border bg-card", className)}>
      {hasHeader && (
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
          <div className="min-w-0">
            {title && (
              <h2 className="flex items-center gap-2 text-sm font-medium">
                {icon}
                <span className="truncate">{title}</span>
              </h2>
            )}
            {description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {action}
            {viewAllTo && (
              <Link
                to={viewAllTo}
                className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                View all <ChevronRight className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
      <div className={cn("flex-1 px-4 pb-4", hasHeader ? "pt-3" : "pt-4", contentClassName)}>{children}</div>
    </section>
  );
}

export default SectionCard;
