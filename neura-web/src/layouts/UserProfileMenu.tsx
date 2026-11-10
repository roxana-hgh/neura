import { useTranslation } from "react-i18next";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { detachPushOnSignOut } from "@/features/notifications/lib/push";
import { useNavigate } from "react-router-dom";

function ProfileMenu() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();

  const handleLogout = async () => {
    await detachPushOnSignOut();
    await authClient.signOut();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("header.accountMenu")} className="size-8">
          <User className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{session?.user?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <User className="mr-px h-4 w-4" />
          <span className="text-sm">{t("header.account")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-500 focus:text-red-600"
        >
          <LogOut className="mr-px h-4 w-4 text-red-500"  />
          <span className="text-sm">{t("header.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProfileMenu;