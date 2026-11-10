import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Brain,
  CalendarDays,
  CheckSquare,
  Home,
  Search,
  StickyNote,
  Target,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NeuraLogo from "@/layouts/NeuraLogo";
import { useSearchStore } from "@/features/search/stores/searchStore";

const DESTINATIONS = [
  { to: "/tasks", label: "Tasks", hint: "What's on your plate", icon: CheckSquare },
  { to: "/calendar", label: "Calendar", hint: "Your week at a glance", icon: CalendarDays },
  { to: "/notes", label: "Notes", hint: "Ideas you wrote down", icon: StickyNote },
  { to: "/goals", label: "Goals", hint: "Where you're heading", icon: Target },
  { to: "/brainstorms", label: "Brainstorms", hint: "Your capture inbox", icon: Brain },
  { to: "/assistant", label: "Assistant", hint: "Ask Neura anything", icon: Sparkles },
];

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { pathname, key } = useLocation();
  const openSearch = useSearchStore((s) => s.setOpen);

  // "default" means this was the first entry in history (opened directly),
  // so there's nowhere to go back to.
  const canGoBack = key !== "default";
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="relative isolate flex min-h-[calc(100svh-10rem)] items-center justify-center overflow-hidden px-4 py-12">
      {/* Backdrop: dotted field fading out from the centre + soft glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-size-[22px_22px] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-72 w-[36rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="flex w-full max-w-2xl flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500/60" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
          </span>
          Error 404 · Page not found
        </span>

        {/* 4 [brain] 4 */}
        <div
          aria-hidden="true"
          className="mt-8 flex select-none items-center gap-3 sm:gap-5"
        >
          <span className="bg-linear-to-b from-foreground to-foreground/15 bg-clip-text text-8xl font-bold leading-none tracking-tighter text-transparent sm:text-[9rem]">
            4
          </span>
          <span className="relative flex size-20 items-center justify-center sm:size-28">
            <span className="absolute inset-0 animate-[spin_14s_linear_infinite] rounded-full border border-dashed border-foreground/20">
              <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-foreground/40" />
            </span>
            <span className="absolute inset-3 animate-[spin_9s_linear_infinite_reverse] rounded-full border border-foreground/10 sm:inset-4">
              <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-foreground/30" />
            </span>
            <NeuraLogo className="size-11 rounded-2xl p-2.5 shadow-lg ring-4 ring-background sm:size-14 sm:p-3" />
          </span>
          <span className="bg-linear-to-b from-foreground to-foreground/15 bg-clip-text text-8xl font-bold leading-none tracking-tighter text-transparent sm:text-[9rem]">
            4
          </span>
        </div>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight sm:text-3xl">
          Even a second brain forgets sometimes
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          We couldn't find anything at{" "}
          <code
            dir="ltr"
            className="break-all rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-foreground"
          >
            {pathname}
          </code>
          . It may have been moved, deleted, or never existed.
        </p>

        <button
          type="button"
          onClick={() => openSearch(true)}
          className="group mt-7 flex w-full max-w-sm items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-left text-sm text-muted-foreground shadow-xs transition hover:border-foreground/20 hover:shadow-sm"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1">Search tasks, notes, goals…</span>
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline">
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        </button>

        <div className="mt-4 flex w-full max-w-sm flex-col-reverse gap-2 sm:w-auto sm:max-w-none sm:flex-row">
          {canGoBack && (
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
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

        <div className="mt-12 w-full">
          <div className="mb-3 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Or pick up where you left off
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {DESTINATIONS.map(({ to, label, hint, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group relative flex flex-col items-start gap-2.5 rounded-xl border border-border bg-card p-3 text-left transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md sm:p-4"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
                </span>
                <ArrowUpRight className="absolute right-3 top-3 size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
