
// src/components/Editor/Editor.tsx
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {TextStyle} from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Toolbar from "./Toolbar";
import { useCallback } from "react";

interface EditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

export default function RichEditor({
  content = "",
  onChange,
  placeholder = "Write something...",
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline cursor-pointer" },
      }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  // Convert a File to base64 and insert it into the editor
  const insertImageFile = useCallback(
    (file: File) => {
      if (!editor || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    },
    [editor]
  );

  // Drag & drop onto the editor area
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((f) => f.type.startsWith("image/"));
      if (!imageFile) return;
      e.preventDefault();
      e.stopPropagation();
      insertImageFile(imageFile);
    },
    [insertImageFile]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (Array.from(e.dataTransfer.items).some((i) => i.type.startsWith("image/"))) {
      e.preventDefault(); // allow drop
    }
  };

  return (
    <div className="border border-input rounded-md focus-within:ring-1 focus-within:ring-ring overflow-hidden">
      <Toolbar editor={editor} onImageFile={insertImageFile} />
      <div onDrop={handleDrop} onDragOver={handleDragOver}>
        <EditorContent
          editor={editor}
          className="min-h-[200px] px-4 py-3 text-sm"
        />
      </div>
    </div>
  );
}