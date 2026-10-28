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
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CircleCheckBig,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Goals",
    url: "/goals",
    icon: Target,
  },
  {
    title: "Reminders",
    url: "/reminders",
    icon: Bell,
  },
  {
    title: "Brainstorms",
    url: "/brainstorms",
    icon: Lightbulb,
  },

  {
    title: "Notes",
    url: "/notes",
    icon: StickyNote,
  },
  {
    title: "Focus Mode",
    url: "/focus",
    icon: Timer,
  },
  {
    title: "Habit Tracker",
    url: "/habits",
    icon: CalendarCheck2,
  },
  {
    title: "Chat with AI",
    url: "/assistant",
    icon: Stars,
  },
];

export function SidebarNav() {
  const { data: Taskslists } = useTaskLists();
  const setLists = useTasksStore((s) => s.setLists);

  useEffect(() => {
    if (Taskslists) setLists(Taskslists);
  }, [Taskslists, setLists]);

   const { isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();

  useEffect(() => {
    if (Taskslists) setLists(Taskslists);
  }, [Taskslists, setLists]);

  // Close mobile off-canvas sidebar whenever the route changes
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <Sidebar collapsible="icon" className="">
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
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
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
              <Link to="/lists">Projects</Link>
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
            <SidebarMenuButton>
              <Link to="/settings">
                <div className="flex gap-2">
                  <Settings size={18} />
                  <span>Settings</span>
                </div>
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
