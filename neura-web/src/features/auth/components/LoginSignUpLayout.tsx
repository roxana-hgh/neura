import type { ReactNode } from "react";
import { CheckCircle2, Flame, Sparkles } from "lucide-react";

const BRAIN_PATH =
  "M184 0c30.9 0 56 25.1 56 56v400c0 30.9-25.1 56-56 56c-28.9 0-52.7-21.9-55.7-50.1c-5.2 1.4-10.7 2.1-16.3 2.1c-35.3 0-64-28.7-64-64c0-7.4 1.3-14.6 3.6-21.2C21.4 367.4 0 338.2 0 304c0-31.9 18.7-59.5 45.8-72.3C37.1 220.8 32 207 32 192c0-30.7 21.6-56.3 50.4-62.6C80.8 123.9 80 118 80 112c0-29.9 20.6-55.1 48.3-62.1c3-28 26.8-49.9 55.7-49.9m144 0c28.9 0 52.6 21.9 55.7 49.9C411.5 56.9 432 82 432 112c0 6-.8 11.9-2.4 17.4c28.8 6.2 50.4 31.9 50.4 62.6c0 15-5.1 28.8-13.8 39.7c27.1 12.8 45.8 40.4 45.8 72.3c0 34.2-21.4 63.4-51.6 74.8c2.3 6.6 3.6 13.8 3.6 21.2c0 35.3-28.7 64-64 64c-5.6 0-11.1-.7-16.3-2.1c-3 28.2-26.8 50.1-55.7 50.1c-30.9 0-56-25.1-56-56V56c0-30.9 25.1-56 56-56";

function LogoMark({ className }: { className?: string }) {
  return (
    <span className={`flex size-8 items-center justify-center rounded-lg ${className ?? ""}`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512">
        <path fill="currentColor" d={BRAIN_PATH} />
      </svg>
    </span>
  );
}

const TASKS = [
  { title: "Review weekly goals", done: true },
  { title: "Write project notes", done: true },
  { title: "Deep work, 45 min", done: false },
];

type Props = {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
};

function LoginSignUpLayout({ title, subtitle, footer, children }: Props) {
  return (
    <div className="dark grid h-dvh w-full bg-neutral-950 lg:grid-cols-[1.1fr_1fr] lg:bg-neutral-50">
      {/* Brand side (left on desktop, hidden on mobile) */}
      <aside className="relative hidden overflow-hidden bg-neutral-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 size-105 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[110px]"
        />

        <div className="relative flex items-center gap-2.5">
          <LogoMark className="bg-white text-neutral-900" />
          <span className="text-sm font-semibold tracking-[0.2em]">NEURA</span>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
            <Sparkles className="size-3" />
            AI-powered productivity
          </p>
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">
            Think less.
            <br />
            <span className="text-neutral-500">Do more.</span>
          </h2>

          <div className="relative mt-10">
            <div className="rounded-2xl border border-white/10 bg-white/4 p-5 shadow-2xl backdrop-blur">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-200">Today</span>
                <span className="text-neutral-500">2 / 3</span>
              </div>
              <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-white" />
              </div>
              <ul className="flex flex-col gap-2.5">
                {TASKS.map((t) => (
                  <li key={t.title} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2
                      className={`size-4 ${t.done ? "text-white" : "text-neutral-600"}`}
                    />
                    <span className={t.done ? "text-neutral-500 line-through" : "text-neutral-200"}>
                      {t.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="absolute -right-4 -top-5 hidden items-center gap-2 rounded-full border border-white/10 bg-neutral-900/90 px-3 py-1.5 text-xs text-neutral-200 shadow-xl backdrop-blur xl:flex">
              <Flame className="size-3.5" />
              12 day streak
            </div>
            <div className="absolute -bottom-5 -left-4 hidden items-center gap-2 rounded-full border border-white/10 bg-neutral-900/90 px-3 py-1.5 text-xs text-neutral-200 shadow-xl backdrop-blur xl:flex">
              <Sparkles className="size-3.5" />
              Plan my day
            </div>
          </div>
        </div>

        <p className="relative text-xs text-neutral-500">Tasks · Notes · Habits · Goals · Focus</p>
      </aside>

      {/* Form side: dark on mobile, light on desktop */}
      <main className="relative flex min-h-0 flex-col overflow-y-auto bg-neutral-950 px-6 text-white sm:px-12 lg:bg-neutral-50 lg:text-neutral-900">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-white/10 blur-[90px] lg:hidden"
        />

        <div className="relative mx-auto flex w-full max-w-88 flex-1 flex-col justify-center py-6">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <LogoMark className="bg-white text-neutral-900" />
            <span className="text-sm font-semibold tracking-[0.2em]">NEURA</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-neutral-400 lg:text-neutral-500">{subtitle}</p>

          <div className="mt-6">{children}</div>

          <p className="mt-5 text-center text-sm text-neutral-400 lg:text-neutral-500 [&_a]:mx-1.5 [&_a]:font-medium [&_a]:text-white lg:[&_a]:text-neutral-900 [&_a]:hover:underline">
            {footer}
          </p>
        </div>
      </main>
    </div>
  );
}

export default LoginSignUpLayout;