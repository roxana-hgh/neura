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
            <span className="logo p-1.5 w-7 h-7 flex justify-center items-center font-bold text-lg bg-primary text-primary-foreground rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 512 512"
              >
                <path
                  fill="currentColor"
                  d="M184 0c30.9 0 56 25.1 56 56v400c0 30.9-25.1 56-56 56c-28.9 0-52.7-21.9-55.7-50.1c-5.2 1.4-10.7 2.1-16.3 2.1c-35.3 0-64-28.7-64-64c0-7.4 1.3-14.6 3.6-21.2C21.4 367.4 0 338.2 0 304c0-31.9 18.7-59.5 45.8-72.3C37.1 220.8 32 207 32 192c0-30.7 21.6-56.3 50.4-62.6C80.8 123.9 80 118 80 112c0-29.9 20.6-55.1 48.3-62.1c3-28 26.8-49.9 55.7-49.9m144 0c28.9 0 52.6 21.9 55.7 49.9C411.5 56.9 432 82 432 112c0 6-.8 11.9-2.4 17.4c28.8 6.2 50.4 31.9 50.4 62.6c0 15-5.1 28.8-13.8 39.7c27.1 12.8 45.8 40.4 45.8 72.3c0 34.2-21.4 63.4-51.6 74.8c2.3 6.6 3.6 13.8 3.6 21.2c0 35.3-28.7 64-64 64c-5.6 0-11.1-.7-16.3-2.1c-3 28.2-26.8 50.1-55.7 50.1c-30.9 0-56-25.1-56-56V56c0-30.9 25.1-56 56-56"
                />
              </svg>
            </span>
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
