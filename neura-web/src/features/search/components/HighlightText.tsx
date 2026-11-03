const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Marks every case-insensitive occurrence of `query` in `text`. */
function HighlightText({ text, query, className }: { text: string; query: string; className?: string }) {
  const q = query.trim();
  if (!q) return <span dir="auto" className={className}>{text}</span>;

  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return (
    <span dir="auto" className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="rounded-[3px] bg-primary/12 px-0.5 font-medium text-foreground">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
}

export default HighlightText;
