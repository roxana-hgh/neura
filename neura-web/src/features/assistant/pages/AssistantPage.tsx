import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, SquarePen, X } from "lucide-react";
import { useAssistant, type MentionRef } from "@/features/assistant/hooks/useAssistant";
import { QuickActions } from "@/features/assistant/components/QuickActions";
import { AssistantAvatar, ChatMessage } from "@/features/assistant/components/ChatMessage";
import { TypingIndicator } from "@/features/assistant/components/TypingIndicator";
import { MentionPicker } from "@/features/assistant/components/MentionPicker";
import {
  filterMentionItems,
  MENTION_STYLES,
  type MentionItem,
} from "@/features/assistant/lib/mentionItems";
import { Button } from "@/components/ui/button";
import AlertDialog from "@/components/shared/AlertDialog";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { useHabits } from "@/features/habits/hooks/useHabits";
import type { Habit } from "@/features/habits/types/habit";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { useNotes } from "@/features/notes/hooks/useNotes";
import { useReminders } from "@/features/reminders/hooks/useReminders";
import { useBrainstorms } from "@/features/brainstorms/hooks/useBrainstorms";

const CONTEXT_OPTIONS: Partial<Record<MentionItem["type"], (title: string) => string[]>> = {
  task: (t) => [`Mark "${t}" as done`, `Move "${t}" to tomorrow`, `Break "${t}" down into subtasks`],
  habit: (t) => [`Mark "${t}" as done for today`, `How's my streak on "${t}"?`],
  goal: (t) => [`How am I doing on "${t}"?`, `Suggest next steps for "${t}"`, `Break "${t}" into sub-goals`],
  note: (t) => [`Summarize "${t}"`, `Pull action items out of "${t}"`, `What's your take on "${t}"?`],
  reminder: (t) => [`Mark "${t}" as done`, `Snooze "${t}" for an hour`],
  brainstorm: (t) => [`What do you think of "${t}"?`, `Sharpen "${t}"`, `Turn "${t}" into a task`],
};

export default function AssistantPage() {
  const { messages, sendMessage, sendQuickAction, retry, clearChat, isPending } = useAssistant();
  const { data: session } = useSession();

  const [input, setInput] = useState("");
  const [caret, setCaret] = useState(0);
  const [mentions, setMentions] = useState<MentionItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuDismissed, setMenuDismissed] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [atBottom, setAtBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: tasksData } = useTasks();
  const { data: habitsData } = useHabits("all",
    new Date());
  const { data: goalsData } = useGoals();
  const { notes } = useNotes();
  const { data: remindersData } = useReminders("upcoming");
  const { data: brainstormsData } = useBrainstorms("inbox");

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

    const goalItems: MentionItem[] = (goalsData ?? []).map((g) => ({
      id: g.id, title: g.title, type: "goal" as const, meta: `${g.progress}%`,
    }));
    const noteItems: MentionItem[] = notes.map((n) => ({
      id: String(n.id), title: n.title, type: "note" as const, meta: "note",
    }));
    const reminderItems: MentionItem[] = (remindersData ?? []).map((r) => ({
      id: r.id, title: r.title, type: "reminder" as const, meta: format(new Date(r.nextAt), "MMM d, HH:mm"),
    }));
    const brainstormItems: MentionItem[] = (brainstormsData ?? []).map((b) => ({
      id: b.id, title: b.content.split("\n")[0].slice(0, 80), type: "brainstorm" as const, meta: "idea",
    }));

    return [...taskItems, ...habitItems, ...goalItems, ...noteItems, ...reminderItems, ...brainstormItems];
  }, [tasksData, habitsData, goalsData, notes, remindersData, brainstormsData]);

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

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
  };

  // Jump to the end when the page opens with a restored conversation
  useEffect(() => {
    scrollToBottom("instant");
  }, []);

  // Follow new messages unless the user scrolled up to read; their own messages always scroll
  const lastRole = messages[messages.length - 1]?.role;
  useEffect(() => {
    if (atBottom || lastRole === "user") scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isPending]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  // Focus the composer on desktop; on phones it would pop the keyboard over the suggestions
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) textareaRef.current?.focus();
  }, []);

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

  const removeMention = (item: MentionItem) => {
    setInput((prev) => prev.replace(`"${item.title}" `, "").replace(`"${item.title}"`, ""));
    setMentions((prev) => prev.filter((m) => m.id !== item.id));
    textareaRef.current?.focus();
  };

  const handleNewChat = () => {
    clearChat();
    resetComposer();
    textareaRef.current?.focus();
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
    // isComposing: don't send while an IME is still composing a word
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
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
    return { ref, options: CONTEXT_OPTIONS[m.type]?.(m.title) ?? [] };
  }, [activeMentions]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = session?.user?.name?.split(" ")[0];

  const hasMessages = messages.length > 0;
  const canSend = !!input.trim() && !isPending;

  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] w-full max-w-3xl flex-col overflow-hidden">
      {/* Top bar */}
      {hasMessages && (
        <div className="flex items-center justify-between gap-2 border-b px-1 pb-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <AssistantAvatar />
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold">Neura Assistant</p>
              <p className="truncate text-xs text-muted-foreground">
                {isPending ? "Working on it…" : "Sees and manages everything in Neura"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmClear(true)}
            disabled={isPending}
            className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <SquarePen className="h-4 w-4" />
            <span className="hidden sm:inline">New chat</span>
          </Button>
        </div>
      )}

      {/* Messages: this is the only scroll container */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="no-scrollbar h-full overflow-y-auto px-1 py-6 sm:px-4"
        >
          {!hasMessages ? (
            <div className="flex min-h-full flex-col items-center justify-center gap-7 text-center animate-in fade-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-primary/20 blur-2xl" />
                <AssistantAvatar className="h-14 w-14 rounded-2xl [&_svg]:h-7 [&_svg]:w-7" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {greeting}
                  {firstName ? `, ${firstName}` : ""}
                </h1>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  I can see your tasks, habits, goals, reminders, notes and ideas, change them
                  and tell you what I think. Pick a starting point or just type. English and فارسی both work.
                </p>
              </div>
              <QuickActions onAsk={sendQuickAction} onCompose={handleCompose} disabled={isPending} />
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onRetry={retry}
                  retryDisabled={isPending}
                />
              ))}
              {isPending && <TypingIndicator />}
            </div>
          )}
        </div>

        {!atBottom && hasMessages && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Scroll to latest message"
            onClick={() => scrollToBottom()}
            className="absolute bottom-3 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full bg-background shadow-md animate-in fade-in zoom-in-95"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Composer */}
      <div className="px-1 pb-3 pt-2 sm:px-4">
        {hasMessages && (
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

          <div
            className={cn(
              "rounded-3xl border bg-muted/40 p-1.5 shadow-sm transition-all",
              "focus-within:border-primary/40 focus-within:bg-background focus-within:ring-4 focus-within:ring-primary/10"
            )}
          >
            {activeMentions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-2.5 pt-1.5">
                {activeMentions.map((m) => {
                  const { icon: Icon, className } = MENTION_STYLES[m.type];
                  return (
                    <span
                      key={`${m.type}-${m.id}`}
                      className="inline-flex max-w-56 items-center gap-1 rounded-full border bg-background py-0.5 pl-2 pr-1 text-xs"
                    >
                      <Icon className={cn("h-3 w-3 shrink-0", className)} />
                      <span dir="auto" className="truncate">{m.title}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${m.title}`}
                        onClick={() => removeMention(m)}
                        className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="flex items-end gap-2 pl-3">
              <textarea
                ref={textareaRef}
                dir="auto"
                value={input}
                rows={1}
                aria-label="Message the assistant"
                placeholder={hasMessages ? "Reply, or type / to pick an item…" : "Ask anything, or type / to pick an item…"}
                onChange={(e) => {
                  setInput(e.target.value);
                  setCaret(e.target.selectionStart);
                  setMenuDismissed(false);
                  setActiveIndex(0);
                }}
                onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
                onKeyDown={handleKeyDown}
                className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button
                type="button"
                size="icon"
                aria-label="Send message"
                className={cn(
                  "h-9 w-9 shrink-0 rounded-full transition-all",
                  !canSend && "scale-95"
                )}
                onClick={handleSend}
                disabled={!canSend}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-1.5 hidden text-center text-[11px] text-muted-foreground md:block">
          <kbd className="rounded border bg-muted px-1">Enter</kbd> to send ·{" "}
          <kbd className="rounded border bg-muted px-1">Shift + Enter</kbd> for a new line ·{" "}
          <kbd className="rounded border bg-muted px-1">/</kbd> to mention anything in Neura
        </p>
      </div>

      <AlertDialog
        open={confirmClear}
        setOpen={setConfirmClear}
        title="Start a new chat?"
        description="This conversation will be cleared. Anything the assistant changed stays as it is."
        acceptButtonText="New chat"
        cancelButtonText="Cancel"
        onConfirm={handleNewChat}
      />
    </div>
  );
}
