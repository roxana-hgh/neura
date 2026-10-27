// src/components/NoteContent.tsx
interface NoteContentProps {
  html: string | null;
  className?: string;
}

export default function NoteContent({ html, className }: NoteContentProps) {
  if (!html) return (
    <p className="text-muted-foreground text-sm italic">No content</p>
  );

  return (
    <div
      className={`tiptap-render ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}