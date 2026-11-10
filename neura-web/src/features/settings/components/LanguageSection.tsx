import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import SettingsSection from "@/features/settings/components/SettingsSection";
import { LANGUAGES, setLanguage } from "@/i18n";
import { cn } from "@/lib/utils";

function LanguageSection() {
  const { t, i18n } = useTranslation();

  return (
    <SettingsSection title={t("settings.language.title")} description={t("settings.language.description")}>
      <div role="radiogroup" aria-label={t("settings.language.label")} className="grid grid-cols-2 gap-3 sm:max-w-md">
        {LANGUAGES.map(({ code, label }) => {
          const selected = i18n.language === code;
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => !selected && setLanguage(code)}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-xl border p-3 text-start transition-all",
                selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-foreground/20",
              )}
            >
              <span className="text-sm font-medium">{label}</span>
              {selected && (
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}

export default LanguageSection;
