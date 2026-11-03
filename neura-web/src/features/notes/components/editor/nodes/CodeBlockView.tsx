import { useState } from "react";
import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { CODE_LANGUAGES } from "@/features/notes/lib/codeLanguages";

/** Code block with a language picker (drives the syntax highlighting) and a copy button. */
export default function CodeBlockView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const [copied, setCopied] = useState(false);
  const language = (node.attrs.language as string | null) ?? "";

  const copy = () => {
    void navigator.clipboard.writeText(node.textContent).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <NodeViewWrapper className="note-code group/code">
      <div contentEditable={false} className="note-code-bar">
        <label className="relative flex items-center">
          <span className="sr-only">Language</span>
          <select
            value={language}
            disabled={!editor.isEditable}
            onChange={(e) => updateAttributes({ language: e.target.value || null })}
            className="cursor-pointer appearance-none bg-transparent py-0.5 pr-5 text-xs font-medium text-muted-foreground outline-none hover:text-foreground"
          >
            <option value="">Auto-detect</option>
            {CODE_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 size-3.5 text-muted-foreground" />
        </label>
        <button
          type="button"
          onClick={copy}
          onMouseDown={(e) => e.preventDefault()}
          className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre spellCheck={false}>
        <NodeViewContent<"code"> as="code" className={language ? `language-${language}` : undefined} />
      </pre>
    </NodeViewWrapper>
  );
}
