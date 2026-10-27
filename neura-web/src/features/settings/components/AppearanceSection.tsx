import { Check, Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import SettingsSection from "@/features/settings/components/SettingsSection";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", Icon: Sun, preview: "bg-white border-neutral-200", bar: "bg-neutral-200", accent: "bg-neutral-800" },
  { value: "dark", label: "Dark", Icon: Moon, preview: "bg-neutral-900 border-neutral-700", bar: "bg-neutral-700", accent: "bg-neutral-200" },
] as const;

function AppearanceSection() {
  const isDark = useThemeStore((s) => s.isDark);
  const setTheme = useThemeStore((s) => s.setTheme);
  const current = isDark ? "dark" : "light";

  return (
    <SettingsSection title="Appearance" description="Choose how Neura looks on this device.">
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3 sm:max-w-md">
        {THEMES.map(({ value, label, Icon, preview, bar, accent }) => {
          const selected = current === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(value)}
              className={cn(
                "group cursor-pointer rounded-xl border p-2 text-left transition-all",
                selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-foreground/20",
              )}
            >
              {/* mini app preview */}
              <div className={cn("flex h-20 gap-1.5 rounded-lg border p-2", preview)}>
                <div className={cn("w-1/4 rounded", bar)} />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className={cn("h-2 w-2/3 rounded", accent)} />
                  <div className={cn("h-2 w-full rounded", bar)} />
                  <div className={cn("h-2 w-4/5 rounded", bar)} />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between px-0.5">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Icon className="size-4 text-muted-foreground" />
                  {label}
                </span>
                {selected && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}

export default AppearanceSection;
