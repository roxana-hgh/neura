import {
  BookOpen,
  Clapperboard,
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Send,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import type { LinkProviderId } from "@/features/notes/lib/linkProviders";
import { cn } from "@/lib/utils";

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.57l11.1 14.43Z" />
    </svg>
  );
}

/** Brand tile colors; the icon is always white on top */
const PROVIDER_STYLES: Record<LinkProviderId, { icon: LucideIcon | typeof XLogo; tile: string }> = {
  youtube: { icon: Youtube, tile: "bg-[#ff0033]" },
  x: { icon: XLogo, tile: "bg-black dark:bg-zinc-800" },
  instagram: { icon: Instagram, tile: "bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5]" },
  tiktok: { icon: Clapperboard, tile: "bg-black dark:bg-zinc-800" },
  vimeo: { icon: Clapperboard, tile: "bg-[#1ab7ea]" },
  spotify: { icon: Music2, tile: "bg-[#1db954]" },
  soundcloud: { icon: Music2, tile: "bg-[#ff5500]" },
  github: { icon: Github, tile: "bg-zinc-900 dark:bg-zinc-700" },
  linkedin: { icon: Linkedin, tile: "bg-[#0a66c2]" },
  reddit: { icon: MessageCircle, tile: "bg-[#ff4500]" },
  telegram: { icon: Send, tile: "bg-[#229ed9]" },
  facebook: { icon: Facebook, tile: "bg-[#1877f2]" },
  threads: { icon: MessageCircle, tile: "bg-black dark:bg-zinc-800" },
  aparat: { icon: Clapperboard, tile: "bg-[#ed145b]" },
  medium: { icon: BookOpen, tile: "bg-zinc-900 dark:bg-zinc-700" },
  web: { icon: Globe, tile: "bg-muted-foreground/70" },
};

export default function LinkProviderIcon({
  provider,
  className,
}: {
  provider: LinkProviderId;
  className?: string;
}) {
  const { icon: Icon, tile } = PROVIDER_STYLES[provider];
  return (
    <span
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-white", tile, className)}
    >
      <Icon className="size-[18px]" />
    </span>
  );
}
