import { Navigate } from "react-router-dom";
import { useSession } from "../../../lib/auth-client";
import Loader from "../../ui/loader";

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <Loader screen />;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default GuestRoute;