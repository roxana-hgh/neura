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
import { useNavigate } from "react-router-dom";

function ProfileMenu() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const handleLogout = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="xs" className="flex items-center">
          <User />
          <span className="hidden md:block">{session?.user?.name ?? "Profile"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{session?.user?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <User className="mr-px h-4 w-4" />
          <span className="text-sm">Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-500 focus:text-red-600"
        >
          <LogOut className="mr-px h-4 w-4 text-red-500"  />
          <span className="text-sm">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProfileMenu;