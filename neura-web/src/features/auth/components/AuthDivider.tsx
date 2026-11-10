import { useTranslation } from "react-i18next";
function AuthDivider({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3" role="separator">
      <div className="h-px flex-1 bg-neutral-800 lg:bg-neutral-200" />
      <span className="text-[11px] uppercase tracking-wider text-neutral-500">{label ?? t("auth.orContinue")}</span>
      <div className="h-px flex-1 bg-neutral-800 lg:bg-neutral-200" />
    </div>
  );
}

export default AuthDivider;