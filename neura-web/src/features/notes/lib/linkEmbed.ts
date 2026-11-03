import { mergeAttributes, Node } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import { TextSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import LinkEmbedView from "@/features/notes/components/editor/nodes/LinkEmbedView";
import { detectLink, isStandaloneUrl, parseUrl } from "@/features/notes/lib/linkProviders";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    linkEmbed: {
      /** Inserts a link card for `url` (http/https only) */
      setLinkEmbed: (url: string) => ReturnType;
    };
  }
}

// Each attribute is stored as data-<name> on the saved <div>
const dataAttr = (name: string) => ({
  default: null,
  parseHTML: (el: HTMLElement) => el.getAttribute(`data-${name}`),
  renderHTML: (attrs: Record<string, unknown>) => (attrs[name] ? { [`data-${name}`]: attrs[name] } : {}),
});

/**
 * A link shown as a card: provider, kind ("YouTube · Video", "X · Post"), title / post text and author.
 * The saved HTML keeps a plain <a> inside, so previews, search and the assistant still see the link.
 */
export const LinkEmbed = Node.create({
  name: "linkEmbed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      url: dataAttr("url"),
      title: dataAttr("title"),
      author: dataAttr("author"),
      thumbnail: dataAttr("thumbnail"),
      text: dataAttr("text"),
      /** The API was asked for a preview (so it isn't asked again on every open) */
      fetched: {
        default: false,
        parseHTML: (el: HTMLElement) => el.hasAttribute("data-fetched"),
        renderHTML: (attrs: Record<string, unknown>) => (attrs.fetched ? { "data-fetched": "" } : {}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="link-embed"]',
        // never load a javascript: or other non-web URL
        getAttrs: (el) => (parseUrl((el as HTMLElement).getAttribute("data-url") ?? "") ? null : false),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { url, title, text } = node.attrs as { url: string; title: string | null; text: string | null };
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "link-embed" }),
      ["a", { href: url, target: "_blank", rel: "noopener noreferrer nofollow" }, title || text || url],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkEmbedView);
  },

  addCommands() {
    return {
      setLinkEmbed:
        (url) =>
        ({ commands }) => {
          const parsed = parseUrl(url);
          if (!parsed) return false;
          return commands.insertContent([{ type: this.name, attrs: { url: parsed.href } }, { type: "paragraph" }]);
        },
    };
  },
});

/**
 * Paste handler: a recognized link (YouTube, X, Instagram, …) pasted on an empty line becomes a card.
 * Links pasted inside text, and unknown sites, stay ordinary links.
 */
export function pasteLinkAsEmbed(view: EditorView, event: ClipboardEvent): boolean {
  const text = event.clipboardData?.getData("text/plain")?.trim() ?? "";
  if (!isStandaloneUrl(text)) return false;
  const info = detectLink(text);
  if (!info || info.provider === "web") return false;

  const { state } = view;
  const { $from, empty } = state.selection;
  const parent = $from.parent;
  if (!empty || parent.type.name !== "paragraph" || parent.content.size > 0) return false;

  const { linkEmbed, paragraph } = state.schema.nodes;
  const embed = linkEmbed.create({ url: info.url });
  const start = $from.before();
  const tr = state.tr.replaceWith(start, $from.after(), [embed, paragraph.create()]);
  tr.setSelection(TextSelection.create(tr.doc, start + embed.nodeSize + 1));
  view.dispatch(tr.scrollIntoView());
  return true;
}
