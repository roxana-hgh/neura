import { Outlet, ScrollRestoration } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import SidebarNav from "@/layouts/SidebarNav";
import Header from "@/layouts/Header";
import { Toaster } from "@/components/ui/sonner";
import NotificationWatcher from "@/features/notifications/components/NotificationWatcher";
import GlobalSearch from "@/features/search/components/GlobalSearch";
import QuickAccessFab from "@/layouts/QuickAccessFab";

function AppLayout() {
  return (
    <SidebarProvider>
      <ScrollRestoration />
      <SidebarNav />
      <div className="w-full">
       <Header />
        <main className="w-full px-3 py-5 lg:px-6 container mx-auto">
          <Outlet />
        </main>
         <Toaster />
         <NotificationWatcher />
         <GlobalSearch />
         <QuickAccessFab />
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;
