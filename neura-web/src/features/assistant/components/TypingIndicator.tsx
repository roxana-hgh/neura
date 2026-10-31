export function TypingIndicator() {
  return (
    <div role="status" aria-live="polite" className="animate-in fade-in duration-300">
      <span className="text-shimmer text-[15px] leading-7">Thinking…</span>
    </div>
  );
}
