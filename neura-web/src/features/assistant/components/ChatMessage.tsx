import { useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, Check, Copy, RotateCcw } from "lucide-react";

import type { ChatMessage as ChatMessageType } from "@/features/assistant/hooks/useAssistant";
import { MarkdownMessage } from "@/features/assistant/components/MarkdownMessage";
import { ActionBadge } from "@/features/assistant/components/ActionBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: (id: string) => void;
  retryDisabled?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard can be blocked (insecure origin, permissions); nothing useful to show
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy message"}
      title={copied ? "Copied" : "Copy"}
      className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

export function ChatMessage({ message, onRetry, retryDisabled }: ChatMessageProps) {
  const isUser = message.role === "user";
  const time = message.createdAt ? format(message.createdAt, "HH:mm") : null;

  // Shown on hover on desktop, always visible on touch screens
  const metaRow = (
    <div
      className={cn(
        "flex items-center gap-0.5 text-[11px] text-muted-foreground transition-opacity",
        "md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
        isUser && "flex-row-reverse"
      )}
    >
      <CopyButton text={message.content} />
      {time && <span className="px-1 tabular-nums">{time}</span>}
    </div>
  );

  if (isUser) {
    return (
      <div className="group flex flex-col items-end gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div
          dir="auto"
          className="max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-[1.25rem] bg-secondary px-4 py-2.5 text-[15px] leading-relaxed text-secondary-foreground sm:max-w-[75%]"
        >
          {message.content}
        </div>
        {metaRow}
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex gap-2.5 rounded-2xl bg-destructive/5 px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-destructive" />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <p dir="auto" className="text-[15px] leading-relaxed text-foreground">
            {message.content}
          </p>
          {message.retry && onRetry && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={retryDisabled}
              onClick={() => onRetry(message.id)}
              className="rounded-full"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Try again
            </Button>
          )}
        </div>
      </div>
    );
  }

  const actions = message.actions ?? [];

  return (
    <div className="group flex min-w-0 flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <MarkdownMessage content={message.content} className="text-[15px] leading-7 text-foreground" />

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {actions.map((action, i) => (
            <ActionBadge key={i} action={action} />
          ))}
        </div>
      )}

      <div className="-ml-1.5 -mt-1">{metaRow}</div>
    </div>
  );
}
