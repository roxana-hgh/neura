import { Link } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";

import ProfileMenu from "@/layouts/UserProfileMenu";

function Header() {
  return (
    <header className="w-full flex justify-between p-2 border-b h-auto">
      <SidebarTrigger />

      <div className="md:hidden">
      <Link to="/" >
          <div className="logo-sec flex items-center gap-2  ">
          <span className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold ">Neura</h2>
          </span>
        </div>
      </Link>
      </div>

      <div className="md:px-3 flex items-center gap-1 md:gap-3">
        <ProfileMenu />
      </div>
    </header>
  );
}

export default Header;
