import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** Title + description on the left, content card on the right (stacked on mobile) */
function SettingsSection({ title, description, children, className }: SettingsSectionProps) {
  return (
    <section className={cn("grid gap-3 md:grid-cols-[220px_1fr] md:gap-8", className)}>
      <div className="px-1">
        <h2 className="text-sm font-medium">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0 rounded-xl border border-border bg-card p-4 md:p-5">{children}</div>
    </section>
  );
}

export default SettingsSection;
