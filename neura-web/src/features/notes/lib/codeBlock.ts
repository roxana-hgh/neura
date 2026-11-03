import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import CodeBlockView from "@/features/notes/components/editor/nodes/CodeBlockView";

// lowlight's "common" bundle (~35 languages); HTML is highlighted by "xml"
const lowlight = createLowlight(common);

/** Replaces StarterKit's code block: syntax highlighting + language picker + copy button */
export const NoteCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
}).configure({ lowlight, defaultLanguage: null });
