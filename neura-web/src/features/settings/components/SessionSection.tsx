import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { detachPushOnSignOut } from "@/features/notifications/lib/push";
import { Button } from "@/components/ui/button";
import SettingsSection from "@/features/settings/components/SettingsSection";

function SessionSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await detachPushOnSignOut();
      await authClient.signOut();
      navigate("/login");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SettingsSection title={t("settings.session.title")} description={t("settings.session.description")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("settings.session.signedInAs")}</p>
          <p className="truncate text-sm text-muted-foreground">{session?.user.email ?? "…"}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={signingOut}
          onClick={handleSignOut}
          className="text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4" />
          {signingOut ? t("settings.session.signingOut") : t("settings.session.signOut")}
        </Button>
      </div>
    </SettingsSection>
  );
}

export default SessionSection;
