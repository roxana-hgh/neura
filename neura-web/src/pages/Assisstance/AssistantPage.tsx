import { useEffect, useRef, useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { useAssistant } from "../../components/features/assistant/hooks/Useassistant";
import { QuickActions } from "../../components/features/assistant/components/Quickactions";
import { ChatMessage } from "../../components/features/assistant/components/Chatmessage";
import { TypingIndicator } from "../../components/features/assistant/components/Typingindicator";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";



export default function AssistantPage() {
  const { messages, sendMessage, sendQuickAction, isPending } = useAssistant();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  const handleSend = () => {
    if (!input.trim() || isPending) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Compose actions (e.g. "Add a task") prefill the input and hand focus back
  // to the user, rather than sending immediately — the assistant needs the
  // specifics only the user can provide.
  const handleCompose = (draft: string) => {
    setInput(draft);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(draft.length, draft.length);
    });
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] w-full max-w-2xl flex-col overflow-y-auto no-scrollbar">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 px-1 sm:px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">Ask me about your tasks</p>
              <p className="mt-1 text-sm text-muted-foreground">
                I can summarize what's due, or add, edit, and complete tasks for you.
              </p>
            </div>
            <QuickActions onAsk={sendQuickAction} onCompose={handleCompose} disabled={isPending} />
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isPending && <TypingIndicator />}
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t bg-background/80 px-1 sm:px-4  py-3 backdrop-blur">
        {messages.length > 0 && (
          <div className="mb-3">
            <QuickActions onInputTop onAsk={sendQuickAction} onCompose={handleCompose} disabled={isPending} />
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your tasks..."
            rows={1}
            className="min-h-[44px] max-h-32 resize-none rounded-2xl"
            disabled={isPending}
          />
          <Button
            type="button"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
            onClick={handleSend}
            disabled={isPending || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}