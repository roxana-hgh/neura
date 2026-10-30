import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { pathname, key } = useLocation();

  // "default" means this was the first entry in history (opened directly),
  // so there's nowhere to go back to.
  const canGoBack = key !== "default";

  return (
    <div className="flex min-h-[calc(100svh-10rem)] items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
     

        <p className="select-none bg-linear-to-b from-foreground/80 to-foreground/5 bg-clip-text text-8xl font-bold tracking-tighter text-transparent sm:text-9xl">
          404
        </p>

        <h1 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <code
          dir="ltr"
          className="mt-5 max-w-full break-all rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
        >
          {pathname}
        </code>

        <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row">
          {canGoBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="size-4" />
              Go back
            </Button>
          )}
          <Button size="sm" asChild>
            <Link to="/">
              <Home className="size-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}