import { Link } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";

import ProfileMenu from "@/layouts/UserProfileMenu";
import NeuraLogo from "@/layouts/NeuraLogo";
import NotificationCenter from "@/features/notifications/components/NotificationCenter";

// Three columns (1fr · auto · 1fr) keep the mobile logo exactly centred,
// whatever the widths of the left and right icon groups.
function Header() {
  return (
    <header className="grid h-12 w-full grid-cols-[1fr_auto_1fr] items-center gap-2 border-b px-2 md:px-3">
      <div className="flex items-center justify-self-start">
        <SidebarTrigger className="size-8" />
      </div>

      <Link to="/" className="flex items-center gap-2 md:hidden" aria-label="Neura home">
        <NeuraLogo className="size-6 p-1" />
        <span className="text-base font-bold tracking-tight">Neura</span>
      </Link>

      <div className="col-start-3 flex items-center gap-1 justify-self-end md:gap-2">
        <NotificationCenter />
        <ProfileMenu />
      </div>
    </header>
  );
}

export default Header;
