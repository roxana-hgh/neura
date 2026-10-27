
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InstallPrompt from "@/features/pwa/components/InstallPrompt";

const queryClient = new QueryClient();
function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <InstallPrompt />
      </QueryClientProvider>
    </>
  );
}

export default App;
