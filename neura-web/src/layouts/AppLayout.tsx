import { Outlet } from "react-router-dom";
import { SidebarProvider } from "../components/ui/sidebar";
import SidebarNav from "./Nav/SidebarNav";
import Header from "./Header";
import { Toaster } from "../components/ui/sonner";

function AppLayout() {
  return (
    <SidebarProvider>
      <SidebarNav />
      <div className="w-full">
       <Header />
        <main className="w-full px-3 py-5 lg:px-6 container mx-auto">
          <Outlet />
        </main>
         <Toaster />
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;
