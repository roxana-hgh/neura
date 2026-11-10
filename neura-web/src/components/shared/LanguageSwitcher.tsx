import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, setLanguage } from "@/i18n";
import { cn } from "@/lib/utils";

function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const next = LANGUAGES.find((l) => l.code !== i18n.language) ?? LANGUAGES[0];

  return (
    <button
      type="button"
      onClick={() => setLanguage(next.code)}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs text-neutral-400 transition-colors hover:text-white lg:border-neutral-300 lg:text-neutral-600 lg:hover:text-neutral-900",
        className,
      )}
    >
      <Languages className="size-3.5" />
      {next.label}
    </button>
  );
}

export default LanguageSwitcher;
