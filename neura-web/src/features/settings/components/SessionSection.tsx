import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { detachPushOnSignOut } from "@/features/notifications/lib/push";
import { Button } from "@/components/ui/button";
import SettingsSection from "@/features/settings/components/SettingsSection";

function SessionSection() {
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
    <SettingsSection title="Session" description="You're signed in on this browser.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Signed in as</p>
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
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </SettingsSection>
  );
}

export default SessionSection;
