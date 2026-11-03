import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { ExternalLink, Link2, Play, X } from "lucide-react";
import LinkProviderIcon from "@/features/notes/components/editor/nodes/LinkProviderIcon";
import { detectLink, titleFromUrl } from "@/features/notes/lib/linkProviders";
import type { LinkPreview } from "@/features/notes/types/note";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface EmbedAttrs {
  url: string;
  title: string | null;
  author: string | null;
  thumbnail: string | null;
  text: string | null;
  fetched: boolean;
}

export default function LinkEmbedView({ node, editor, getPos, selected, deleteNode }: ReactNodeViewProps) {
  const attrs = node.attrs as EmbedAttrs;
  const info = detectLink(attrs.url);
  const [playing, setPlaying] = useState(false);
  const requested = useRef(false);

  // Ask the API once for a title / author / post text, then keep it in the note
  useEffect(() => {
    if (!info?.canUnfurl || attrs.fetched || requested.current) return;
    requested.current = true;
    const url = attrs.url;
    api
      .get<LinkPreview | null>("/notes/unfurl", { params: { url } })
      .then(({ data }) => {
        const pos = getPos();
        if (typeof pos !== "number" || editor.isDestroyed) return;
        const current = editor.state.doc.nodeAt(pos);
        if (current?.type.name !== "linkEmbed" || current.attrs.url !== url) return;
        // a background fill-in, so it shouldn't be an undo step
        const tr = editor.state.tr
          .setNodeMarkup(pos, undefined, {
            ...current.attrs,
            fetched: true,
            title: data?.title ?? current.attrs.title,
            author: data?.author ?? current.attrs.author,
            thumbnail: data?.thumbnail ?? current.attrs.thumbnail,
            text: data?.text ?? current.attrs.text,
          })
          .setMeta("addToHistory", false);
        editor.view.dispatch(tr);
      })
      .catch(() => {
        // no preview; the card still shows what the link is
      });
  }, [info?.canUnfurl, attrs.fetched, attrs.url, editor, getPos]);

  if (!info) {
    return (
      <NodeViewWrapper className="my-3 rounded-xl border border-dashed p-3 text-sm text-muted-foreground" contentEditable={false}>
        Invalid link
      </NodeViewWrapper>
    );
  }

  const toTextLink = () => {
    const pos = getPos();
    if (typeof pos !== "number") return;
    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: pos, to: pos + node.nodeSize },
        { type: "paragraph", content: [{ type: "text", text: info.url, marks: [{ type: "link", attrs: { href: info.url } }] }] }
      )
      .run();
  };

  const title = attrs.title || (attrs.text ? null : titleFromUrl(info.url));
  const byline = attrs.author ?? info.handle;
  const thumbnail = attrs.thumbnail ?? info.thumbnail;
  const isPlayer = !!info.embedUrl;

  return (
    <NodeViewWrapper
      contentEditable={false}
      className={cn(
        "note-embed group/embed relative my-3 overflow-hidden rounded-xl border bg-card transition-shadow",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {isPlayer && (
        <div className="relative aspect-video w-full bg-black">
          {playing ? (
            <iframe
              src={`${info.embedUrl}${info.embedUrl!.includes("?") ? "&" : "?"}autoplay=1`}
              title={title ?? info.name}
              className="absolute inset-0 size-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play ${info.kind.toLowerCase()}`}
              className="group/play absolute inset-0 flex cursor-pointer items-center justify-center"
            >
              {thumbnail && <img src={thumbnail} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />}
              <span className="relative flex size-14 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-transform group-hover/play:scale-110">
                <Play className="size-6 translate-x-0.5 fill-current" />
              </span>
            </button>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 p-3">
        <LinkProviderIcon provider={info.provider} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            <span className="truncate">{info.name}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0">{info.kind}</span>
          </p>
          <a
            href={info.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            dir="auto"
            className="mt-0.5 block text-[15px] leading-snug font-semibold text-foreground no-underline hover:underline"
          >
            {attrs.text ? (
              <span className="line-clamp-4 font-normal whitespace-pre-line">{attrs.text}</span>
            ) : (
              <span className="line-clamp-2">{title}</span>
            )}
          </a>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            {byline && <span className="truncate font-medium text-foreground/80">{byline}</span>}
            {byline && <span aria-hidden>·</span>}
            <span className="truncate" dir="ltr">{info.domain}</span>
          </p>
        </div>
      </div>

      {editor.isEditable && (
        <div
          className={cn(
            "absolute top-2 right-2 flex gap-0.5 rounded-lg border bg-background/90 p-0.5 shadow-sm backdrop-blur transition-opacity",
            "opacity-0 group-hover/embed:opacity-100 focus-within:opacity-100",
            selected && "opacity-100"
          )}
        >
          <CardButton label="Open in new tab" onClick={() => window.open(info.url, "_blank", "noopener,noreferrer")}>
            <ExternalLink />
          </CardButton>
          <CardButton label="Show as text link" onClick={toTextLink}>
            <Link2 />
          </CardButton>
          <CardButton label="Remove card" onClick={deleteNode}>
            <X />
          </CardButton>
        </div>
      )}
    </NodeViewWrapper>
  );
}

function CardButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}
