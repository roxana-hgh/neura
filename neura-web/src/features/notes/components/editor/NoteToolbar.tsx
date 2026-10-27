import { useRef, useState, type ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  Code2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HIGHLIGHT_COLORS, TEXT_COLORS } from "@/features/notes/lib/editorExtensions";
import { firstImageFile, insertImageFile } from "@/features/notes/lib/noteImage";
import { cn } from "@/lib/utils";

interface NoteToolbarProps {
  editor: Editor;
  /** "bottom" is the mobile bar above the keyboard; popovers open upwards */
  placement: "top" | "bottom";
}

// Pressing a toolbar button must not steal focus from the editor,
// otherwise the mobile keyboard closes on every tap
const keepFocus = (e: React.MouseEvent) => e.preventDefault();

const TEXT_STYLES = [
  { label: "Title", level: 1, className: "text-xl font-bold" },
  { label: "Heading", level: 2, className: "text-lg font-semibold" },
  { label: "Subheading", level: 3, className: "text-base font-semibold" },
  { label: "Body", level: 0, className: "text-sm" },
] as const;

const ALIGNMENTS = [
  { value: "left", label: "Align left", icon: AlignLeft },
  { value: "center", label: "Align center", icon: AlignCenter },
  { value: "right", label: "Align right", icon: AlignRight },
  { value: "justify", label: "Justify", icon: AlignJustify },
] as const;

export default function NoteToolbar({ editor, placement }: NoteToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const side = placement === "bottom" ? "top" : "bottom";

  // TipTap v3 doesn't re-render on every transaction, so subscribe to what the toolbar shows
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      taskList: e.isActive("taskList"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
      heading: ([1, 2, 3] as const).find((level) => e.isActive("heading", { level })) ?? 0,
      align:
        ALIGNMENTS.find((a) => e.isActive({ textAlign: a.value }))?.value ?? "left",
      color: (e.getAttributes("textStyle").color as string | undefined) ?? "",
      highlight: (e.getAttributes("highlight").color as string | undefined) ?? "",
    }),
  });

  const chain = () => editor.chain().focus();
  const currentStyle = TEXT_STYLES.find((t) => t.level === s.heading) ?? TEXT_STYLES[3];
  const AlignIcon = ALIGNMENTS.find((a) => a.value === s.align)?.icon ?? AlignLeft;

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar px-2 py-1.5">
      <ToolButton label="Undo" disabled={!s.canUndo} onClick={() => chain().undo().run()}>
        <Undo2 />
      </ToolButton>
      <ToolButton label="Redo" disabled={!s.canRedo} onClick={() => chain().redo().run()}>
        <Redo2 />
      </ToolButton>

      <Divider />

      {/* Text style */}
      <ToolPopover
        side={side}
        label="Text style"
        trigger={
          <span className="flex items-center gap-1 px-1.5 text-sm font-medium">
            {currentStyle.label}
            <ChevronDown className="size-3.5 opacity-60" />
          </span>
        }
        wide
      >
        <div className="flex flex-col gap-0.5 p-1">
          {TEXT_STYLES.map((t) => (
            <button
              key={t.label}
              type="button"
              onMouseDown={keepFocus}
              onClick={() =>
                t.level === 0
                  ? chain().setParagraph().run()
                  : chain().setHeading({ level: t.level }).run()
              }
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent",
                s.heading === t.level && "bg-accent"
              )}
            >
              <span className={t.className}>{t.label}</span>
              {s.heading === t.level && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      </ToolPopover>

      <Divider />

      <ToolButton label="Bold" active={s.bold} onClick={() => chain().toggleBold().run()}>
        <Bold />
      </ToolButton>
      <ToolButton label="Italic" active={s.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic />
      </ToolButton>
      <ToolButton
        label="Underline"
        active={s.underline}
        onClick={() => chain().toggleUnderline().run()}
      >
        <Underline />
      </ToolButton>
      <ToolButton
        label="Strikethrough"
        active={s.strike}
        onClick={() => chain().toggleStrike().run()}
      >
        <Strikethrough />
      </ToolButton>

      {/* Text color + highlighter */}
      <ToolPopover
        side={side}
        label="Color and highlight"
        trigger={
          <span className="flex flex-col items-center gap-0.5">
            <span
              className="text-[15px] font-bold leading-none"
              style={{ color: s.color || undefined }}
            >
              A
            </span>
            <span
              className="h-1 w-4 rounded-full"
              style={{ background: s.highlight || s.color || "currentColor" }}
            />
          </span>
        }
        wide
      >
        <div className="flex flex-col gap-3 p-2">
          <SwatchRow
            title="Text color"
            options={TEXT_COLORS}
            active={s.color}
            onPick={(value) =>
              value ? chain().setColor(value).run() : chain().unsetColor().run()
            }
          />
          <SwatchRow
            title="Highlight"
            options={HIGHLIGHT_COLORS}
            active={s.highlight}
            onPick={(value) =>
              value
                ? chain().setHighlight({ color: value }).run()
                : chain().unsetHighlight().run()
            }
          />
        </div>
      </ToolPopover>

      <Divider />

      <ToolButton
        label="Checklist"
        active={s.taskList}
        onClick={() => chain().toggleTaskList().run()}
      >
        <ListChecks />
      </ToolButton>
      <ToolButton
        label="Bullet list"
        active={s.bulletList}
        onClick={() => chain().toggleBulletList().run()}
      >
        <List />
      </ToolButton>
      <ToolButton
        label="Numbered list"
        active={s.orderedList}
        onClick={() => chain().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolButton>

      {/* Alignment */}
      <ToolPopover side={side} label="Alignment" trigger={<AlignIcon className="size-[18px]" />}>
        <div className="flex gap-0.5 p-1">
          {ALIGNMENTS.map(({ value, label, icon: Icon }) => (
            <ToolButton
              key={value}
              label={label}
              active={s.align === value}
              onClick={() => chain().setTextAlign(value).run()}
            >
              <Icon />
            </ToolButton>
          ))}
        </div>
      </ToolPopover>

      <Divider />

      <ToolButton
        label="Quote"
        active={s.blockquote}
        onClick={() => chain().toggleBlockquote().run()}
      >
        <Quote />
      </ToolButton>
      <ToolButton
        label="Code block"
        active={s.codeBlock}
        onClick={() => chain().toggleCodeBlock().run()}
      >
        <Code2 />
      </ToolButton>
      <ToolButton label="Divider" onClick={() => chain().setHorizontalRule().run()}>
        <Minus />
      </ToolButton>

      <LinkPopover editor={editor} side={side} active={s.link} />

      <ToolButton label="Insert image" onClick={() => fileInputRef.current?.click()}>
        <ImagePlus />
      </ToolButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = firstImageFile(e.target.files);
          if (file) void insertImageFile(editor.view, file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Pieces ─────────────────────────────────────────────────

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />;
}

const toolButtonClass = (active?: boolean) =>
  cn(
    "inline-flex h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors",
    "hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-35",
    "[&_svg:not([class*='size-'])]:size-[18px]",
    active && "bg-primary/12 text-primary hover:bg-primary/15 hover:text-primary"
  );

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={keepFocus}
      onClick={onClick}
      className={toolButtonClass(active)}
    >
      {children}
    </button>
  );
}

function ToolPopover({
  label,
  trigger,
  side,
  wide,
  children,
}: {
  label: string;
  trigger: ReactNode;
  side: "top" | "bottom";
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={label}
          aria-label={label}
          onMouseDown={keepFocus}
          className={toolButtonClass()}
        >
          {trigger}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align="start"
        sideOffset={8}
        className={cn("w-auto rounded-xl p-0", wide && "min-w-56")}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

function SwatchRow({
  title,
  options,
  active,
  onPick,
}: {
  title: string;
  options: { label: string; value: string }[];
  active: string;
  onPick: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 px-0.5 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={`${title}: ${label}`}
            onMouseDown={keepFocus}
            onClick={() => onPick(value)}
            className={cn(
              "relative flex size-7 cursor-pointer items-center justify-center rounded-full border border-border transition-transform hover:scale-110",
              active === value && "ring-2 ring-primary ring-offset-2 ring-offset-popover"
            )}
            style={{ background: value || undefined }}
          >
            {!value && <span className="h-px w-5 rotate-45 bg-destructive" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function LinkPopover({
  editor,
  side,
  active,
}: {
  editor: Editor;
  side: "top" | "bottom";
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const onOpenChange = (next: boolean) => {
    if (next) setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    setOpen(next);
  };

  const apply = () => {
    const href = url.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href) chain.setLink({ href }).run();
    else chain.unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Link"
          aria-label="Link"
          aria-pressed={active}
          onMouseDown={keepFocus}
          className={toolButtonClass(active)}
        >
          <Link2 />
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} align="end" sideOffset={8} className="w-72 rounded-xl p-3">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <Input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            inputMode="url"
            dir="ltr"
          />
          <div className="flex justify-end gap-2">
            {active && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                  setOpen(false);
                }}
              >
                Remove
              </Button>
            )}
            <Button type="submit" size="sm">
              {active ? "Update" : "Add link"}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
