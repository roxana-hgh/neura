import { useTranslation } from "react-i18next";
import {
  Home,
  Settings,
  StickyNote,
  CircleCheckBig,
  Timer,
  Stars,
  Calendar,
  CalendarCheck2,
  Target,
  Bell,
  Lightbulb,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { getListColorClass } from "@/features/tasks/utils/colorMapper";
import AddNewList from "@/features/tasks/components/lists/AddNewList";
import { useTaskLists } from "@/features/tasks/hooks/useTasks";
import { useEffect } from "react";
import NeuraLogo from "@/layouts/NeuraLogo";
import { Link, useLocation } from "react-router-dom";

// Menu items.
const items = [
  {
    titleKey: "nav.home",
    url: "/",
    icon: Home,
  },
  {
    titleKey: "nav.tasks",
    url: "/tasks",
    icon: CircleCheckBig,
  },
  {
    titleKey: "nav.calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    titleKey: "nav.goals",
    url: "/goals",
    icon: Target,
  },
  {
    titleKey: "nav.reminders",
    url: "/reminders",
    icon: Bell,
  },
  {
    titleKey: "nav.brainstorms",
    url: "/brainstorms",
    icon: Lightbulb,
  },

  {
    titleKey: "nav.notes",
    url: "/notes",
    icon: StickyNote,
  },
  {
    titleKey: "nav.focus",
    url: "/focus",
    icon: Timer,
  },
  {
    titleKey: "nav.habits",
    url: "/habits",
    icon: CalendarCheck2,
  },
  {
    titleKey: "nav.assistant",
    url: "/assistant",
    icon: Stars,
  },
];

export function SidebarNav() {
  const { t, i18n } = useTranslation();
  const { data: Taskslists } = useTaskLists();
  const setLists = useTasksStore((s) => s.setLists);

  useEffect(() => {
    if (Taskslists) setLists(Taskslists);
  }, [Taskslists, setLists]);

  const { isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();


  // Close mobile off-canvas sidebar whenever the route changes
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <Sidebar collapsible="icon" side={i18n.dir() === "rtl" ? "right" : "left"} className="">
      <SidebarHeader>
        <Link to={"/"} className="">
          <div className="logo-sec flex items-center gap-2  ">
            <NeuraLogo />
            <span className="group-data-[collapsible=icon]:hidden">
              <h2 className="text-2xl font-bold ">Neura</h2>
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.application")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>
            <div className="flex items-center justify-between w-full">
              <Link to="/lists">{t("nav.projects")}</Link>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupAction className=" peer-data-[active=true]/menu-button:opacity-100">
            <AddNewList iconOnlyTrigger />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {Taskslists && Taskslists?.length > 0 &&
                Taskslists?.map((list) => (
                  <SidebarMenuItem key={list.id}>
                    <SidebarMenuButton asChild>
                      <Link to={`/list/${list.id}`}>
                        <div className=" flex items-center gap-2">
                          <span
                            className={`p-1 rounded-full ${getListColorClass(list.color)}`}
                          ></span>
                          <h6 className="text-sm font-medium ">{list.name}</h6>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings">
                <Settings size={18} />
                <span>{t("nav.settings")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default SidebarNav;
