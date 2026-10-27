import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useThemeStore } from "@/stores/themeStore";

import ProfileMenu from "@/layouts/UserProfileMenu";

function Header() {
  const isDarkTheme = useThemeStore((state) => state.isDark);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

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
        <Button
          variant="ghost"
          size="icon-xs"
          className=" items-center cursor-pointer flex"
          asChild
          onClick={toggleTheme}
          aria-label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
          title={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="size-3 md:size-4"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"></path>
            <path d="M12 3l0 18"></path>
            <path d="M12 9l4.65 -4.65"></path>
            <path d="M12 14.3l7.37 -7.37"></path>
            <path d="M12 19.6l8.85 -8.85"></path>
          </svg>
        </Button>

        <ProfileMenu />
      </div>
    </header>
  );
}

export default Header;
