
// src/components/Editor/Toolbar.tsx
import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link, ImageIcon, Undo, Redo, Code, Quote, Upload,
} from "lucide-react";
import { Toggle } from "../../ui/toggle";
import { Separator } from "../../ui/separator";
import { Button } from "../../ui/button";
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "../../ui/tooltip";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "../../ui/popover";
import { useRef } from "react";

interface ToolbarProps {
  editor: Editor | null;
  onImageFile: (file: File) => void;
}

// Preset colors — customize freely
const TEXT_COLORS = [
  { label: "Default",  value: "" },
  { label: "Red",      value: "#ef4444" },
  { label: "Orange",   value: "#f97316" },
  { label: "Yellow",   value: "#eab308" },
  { label: "Green",    value: "#22c55e" },
  { label: "Blue",     value: "#3b82f6" },
  { label: "Indigo",   value: "#6366f1" },
  { label: "Purple",   value: "#a855f7" },
  { label: "Pink",     value: "#ec4899" },
  { label: "Gray",     value: "#6b7280" },
  { label: "Black",    value: "#000000" },
  { label: "White",    value: "#ffffff" },
];

export default function Toolbar({ editor, onImageFile }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageFile(file);
    // reset so same file can be picked again
    e.target.value = "";
  };

  const addImageFromUrl = () => {
    const url = window.prompt("Paste image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const activeColor = editor.getAttributes("textStyle").color ?? "";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap gap-0.5 border-b border-input bg-muted/40 p-1.5">

        {/* History */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} label="Undo">
          <Undo className="size-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} label="Redo">
          <Redo className="size-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-7" />

        {/* Headings */}
        <ToolbarToggle pressed={editor.isActive("heading", { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} label="Heading 1">
          <Heading1 className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle pressed={editor.isActive("heading", { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Heading 2">
          <Heading2 className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle pressed={editor.isActive("heading", { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="Heading 3">
          <Heading3 className="size-4" />
        </ToolbarToggle>

        <Separator orientation="vertical" className="mx-1 h-7" />

        {/* Marks */}
        <ToolbarToggle pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()} label="Bold">
          <Bold className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()} label="Italic">
          <Italic className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle pressed={editor.isActive("underline")} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} label="Underline">
          <Underline className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()} label="Strikethrough">
          <Strikethrough className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle pressed={editor.isActive("code")} onPressedChange={() => editor.chain().focus().toggleCode().run()} label="Code">
          <Code className="size-4" />
        </ToolbarToggle>

        <Separator orientation="vertical" className="mx-1 h-7" />

        {/* Text color picker */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex flex-col items-center justify-center gap-0.5"
                  aria-label="Text color"
                >
                  <span className="text-xs font-bold leading-none"
                    style={{ color: activeColor || "currentColor" }}>
                    A
                  </span>
                  {/* color indicator bar */}
                  <span
                    className="h-1 w-5 rounded-full transition-colors"
                    style={{ backgroundColor: activeColor || "currentColor" }}
                  />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Text color</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-52 p-2" align="start">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Text color</p>
            <div className="grid grid-cols-6 gap-1">
              {TEXT_COLORS.map(({ label, value }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={label}
                      onClick={() => {
                        if (value === "") {
                          editor.chain().focus().unsetColor().run();
                        } else {
                          editor.chain().focus().setColor(value).run();
                        }
                      }}
                      className="size-7 rounded-md border border-border flex items-center justify-center 
                                 hover:scale-110 transition-transform ring-offset-1
                                 focus:outline-none focus:ring-2 focus:ring-ring"
                      style={{
                        backgroundColor: value || "transparent",
                        // show an X pattern for the "default/reset" swatch
                        backgroundImage: value
                          ? undefined
                          : "linear-gradient(to bottom right, transparent calc(50% - 1px), hsl(var(--destructive)) calc(50% - 1px), hsl(var(--destructive)) calc(50% + 1px), transparent calc(50% + 1px))",
                      }}
                    >
                      {/* active indicator */}
                      {activeColor === value && (
                        <span className="size-2 rounded-full bg-white shadow-sm ring-1 ring-black/20" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-1 h-7" />

        {/* Lists */}
        <ToolbarToggle pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} label="Bullet list">
          <List className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} label="Ordered list">
          <ListOrdered className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle pressed={editor.isActive("taskList")} onPressedChange={() => editor.chain().focus().toggleTaskList().run()} label="Checklist">
          <ListChecks className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} label="Quote">
          <Quote className="size-4" />
        </ToolbarToggle>

        <Separator orientation="vertical" className="mx-1 h-7" />

        {/* Alignment */}
        <ToolbarToggle pressed={editor.isActive({ textAlign: "left" })} onPressedChange={() => editor.chain().focus().setTextAlign("left").run()} label="Align left">
          <AlignLeft className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle pressed={editor.isActive({ textAlign: "center" })} onPressedChange={() => editor.chain().focus().setTextAlign("center").run()} label="Align center">
          <AlignCenter className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle pressed={editor.isActive({ textAlign: "right" })} onPressedChange={() => editor.chain().focus().setTextAlign("right").run()} label="Align right">
          <AlignRight className="size-4" />
        </ToolbarToggle>
        <ToolbarToggle pressed={editor.isActive({ textAlign: "justify" })} onPressedChange={() => editor.chain().focus().setTextAlign("justify").run()} label="Justify">
          <AlignJustify className="size-4" />
        </ToolbarToggle>

        <Separator orientation="vertical" className="mx-1 h-7" />

        {/* Link */}
        <ToolbarToggle pressed={editor.isActive("link")} onPressedChange={setLink} label="Link">
          <Link className="size-4" />
        </ToolbarToggle>

        {/* Image from URL */}
        <ToolbarButton onClick={addImageFromUrl} label="Image from URL">
          <ImageIcon className="size-4" />
        </ToolbarButton>

        {/* Image from device */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Upload image from device"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload from device</TooltipContent>
        </Tooltip>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

      </div>
    </TooltipProvider>
  );
}

// ── Reusable pieces ────────────────────────────────────────

function ToolbarToggle({ pressed, onPressedChange, label, children, disabled }: {
  pressed: boolean; onPressedChange: () => void;
  label: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle size="sm" pressed={pressed} onPressedChange={onPressedChange}
          disabled={disabled} aria-label={label} className="h-8 w-8 p-0">
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarButton({ onClick, label, children, disabled }: {
  onClick: () => void; label: string;
  children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="sm" onClick={onClick}
          disabled={disabled} aria-label={label} className="h-8 w-8 p-0">
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}