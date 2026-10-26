import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Sparkles, Send } from "lucide-react";
import { useAssistant, type MentionRef } from "../../components/features/assistant/hooks/Useassistant";
import { QuickActions } from "../../components/features/assistant/components/Quickactions";
import { ChatMessage } from "../../components/features/assistant/components/Chatmessage";
import { TypingIndicator } from "../../components/features/assistant/components/Typingindicator";
import { MentionPicker } from "../../components/features/assistant/components/MentionPicker";
import {
  filterMentionItems,
  type MentionItem,
} from "../../components/features/assistant/components/mentionItems";
import { Button } from "../../components/ui/button";
import { useSession } from "../../lib/auth-client";
import { useTasks } from "../../components/features/Tasks/hooks/useTasks";
import { useHabits } from "../../components/features/Habits/hooks/useHabits";
import type { Habit } from "../../types/habit";

export default function AssistantPage() {
  const { messages, sendMessage, sendQuickAction, isPending } = useAssistant();
  const { data: session } = useSession();

  const [input, setInput] = useState("");
  const [caret, setCaret] = useState(0);
  const [mentions, setMentions] = useState<MentionItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuDismissed, setMenuDismissed] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  const { data: tasksData } = useTasks();
  const { data: habitsData } = useHabits("all",
    new Date());

  const mentionItems = useMemo<MentionItem[]>(() => {
    const tasks = tasksData ?? [];
    const habits: Habit[] = habitsData?.habits ?? [];

    const taskItems: MentionItem[] = [...tasks]
      .sort((a, b) => Number(a.completed) - Number(b.completed)) // open tasks first
      .map((t) => ({
        id: String(t.id),
        title: t.title,
        type: "task" as const,
        meta: t.completed
          ? "done"
          : [t.priority, t.due_date && format(new Date(t.due_date), "MMM d")]
            .filter(Boolean)
            .join(" · "),
      }));

    const habitItems: MentionItem[] = habits
      .filter((h) => !h.isArchived)
      .map((h) => ({ id: h.id, title: h.title, type: "habit" as const, meta: "habit" }));

    return [...taskItems, ...habitItems];
  }, [tasksData, habitsData]);

  // "/" trigger: a slash at the start or after whitespace, up to the caret
  const trigger = useMemo(() => {
    const before = input.slice(0, caret);
    const m = /(?:^|\s)\/([^\n/]{0,40})$/.exec(before);
    return m ? { query: m[1], start: before.length - m[1].length - 1 } : null;
  }, [input, caret]);

  const filtered = useMemo(
    () => (trigger ? filterMentionItems(mentionItems, trigger.query) : []),
    [trigger, mentionItems]
  );
  const menuOpen = !!trigger && !menuDismissed && filtered.length > 0;
  const safeIndex = Math.min(activeIndex, Math.max(filtered.length - 1, 0));

  // Mentions that are still present in the text
  const activeMentions = mentions.filter((m) => input.includes(`"${m.title}"`));

  // auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  // auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  const resetComposer = () => {
    setInput("");
    setCaret(0);
    setMentions([]);
    setMenuDismissed(false);
  };

  const handleSend = () => {
    if (!input.trim() || isPending) return;
    const references: MentionRef[] = activeMentions.map(({ id, title, type }) => ({ id, title, type }));
    sendMessage(input, "custom", references.length ? references : undefined);
    resetComposer();
  };

  const insertMention = (item: MentionItem) => {
    if (!trigger) return;
    const label = `"${item.title}" `;
    const next = input.slice(0, trigger.start) + label + input.slice(caret);
    const pos = trigger.start + label.length;
    setInput(next);
    setCaret(pos);
    setMentions((prev) => (prev.some((m) => m.id === item.id) ? prev : [...prev, item]));
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (menuOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((safeIndex + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((safeIndex - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filtered[safeIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuDismissed(true);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Compose actions prefill the input; a trailing "/" opens the picker right away
  const handleCompose = (draft: string) => {
    setInput(draft);
    setCaret(draft.length);
    setMenuDismissed(false);
    setActiveIndex(0);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(draft.length, draft.length);
    });
  };

  // Contextual chips for the single referenced item
  const contextChips = useMemo(() => {
    if (activeMentions.length !== 1) return null;
    const m = activeMentions[0];
    const ref: MentionRef = { id: m.id, title: m.title, type: m.type };
    const options =
      m.type === "task"
        ? [
          `Mark "${m.title}" as done`,
          `Move "${m.title}" to tomorrow`,
          `Make "${m.title}" high priority`,
        ]
        : [`Mark "${m.title}" as done for today`, `How's my streak on "${m.title}"?`];
    return { ref, options };
  }, [activeMentions]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] w-full max-w-2xl flex-col overflow-hidden">
      {/* Messages — this is the only scroll container */}
      <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-1 py-6 sm:px-4">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-500">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {greeting}
                {firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                What should we tackle? Pick one below or just type — use <kbd className="rounded border bg-muted px-1 text-xs">/</kbd> to point at a task.
              </p>
            </div>
            <QuickActions onAsk={sendQuickAction} onCompose={handleCompose} disabled={isPending} />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isPending && <TypingIndicator />}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-1 pb-3 pt-2 sm:px-4">
        {messages.length > 0 && (
          <div className="mb-2">
            {contextChips ? (
              <div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
                {contextChips.options.map((text) => (
                  <Button
                    key={text}
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={isPending}
                    onClick={() => {
                      sendMessage(text, "custom", [contextChips.ref]);
                      resetComposer();
                    }}
                    className="rounded-full bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {text.replace(`"${contextChips.ref.title}"`, "it")}
                  </Button>
                ))}
              </div>
            ) : (
              <QuickActions variant="chips" onAsk={sendQuickAction} onCompose={handleCompose} disabled={isPending} />
            )}
          </div>
        )}

        <div className="relative">
          {menuOpen && (
            <MentionPicker
              items={filtered}
              activeIndex={safeIndex}
              onSelect={insertMention}
              onHover={setActiveIndex}
            />
          )}

          <div className="flex items-end gap-2 rounded-3xl border bg-muted/40 p-1.5 pl-4 transition-colors focus-within:border-primary/40 focus-within:bg-background">
            <textarea
              ref={textareaRef}
              dir="auto"
              value={input}
              rows={1}
              disabled={isPending}
              placeholder="Ask anything, or type / to pick a task…"
              onChange={(e) => {
                setInput(e.target.value);
                setCaret(e.target.selectionStart);
                setMenuDismissed(false);
                setActiveIndex(0);
              }}
              onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
              onKeyDown={handleKeyDown}
              className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <Button
              type="button"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
              onClick={handleSend}
              disabled={isPending || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}