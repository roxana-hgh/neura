const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Verify current IDs at https://console.groq.com/docs/models — names change.
// Strongest tool-callers first; the small 8b model is a last resort.
const MODEL_POOL = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.1-8b-instant",
] as const;

let rotationCursor = 0;
function getModelOrder(): string[] {
  const start = rotationCursor % MODEL_POOL.length;
  rotationCursor++;
  return [...MODEL_POOL.slice(start), ...MODEL_POOL.slice(0, start)];
}

class RetryableModelError extends Error {}

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

type GroqMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

// Converts the existing Gemini-style [{ functionDeclarations: [...] }]
// into OpenAI/Groq-style tools, so the *-tools.service.ts files stay untouched.
function toGroqTools(tools?: any[]) {
  if (!tools) return undefined;
  return tools.flatMap((group) =>
    (group.functionDeclarations ?? []).map((fn: any) => ({
      type: "function",
      function: {
        name: fn.name,
        description: fn.description,
        parameters: fn.parameters ?? { type: "object", properties: {} },
      },
    }))
  );
}

async function callGroqModel(model: string, messages: GroqMessage[], tools?: any[]) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      ...(tools?.length ? { tools, tool_choice: "auto" } : {}),
    }),
  });

  if (res.status === 429) {
    throw new RetryableModelError(`${model} rate limited`);
  }
  if (!res.ok) {
    const text = await res.text();
    // Model produced a malformed tool call — another model may do better
    if (res.status === 400 && text.includes("tool_use_failed")) {
      throw new RetryableModelError(`${model} tool_use_failed`);
    }
    throw new Error(`Groq API error (${model}): ${res.status} ${text}`);
  }

  return res.json();
}

async function callGroqWithFallback(order: string[], messages: GroqMessage[], tools?: any[]) {
  let lastError: unknown;
  for (const model of order) {
    try {
      const data = await callGroqModel(model, messages, tools);
      return { data, modelUsed: model };
    } catch (err) {
      lastError = err;
      if (err instanceof RetryableModelError) {
        console.warn(`[assistant] ${err.message}, trying next model`);
        continue;
      }
      throw err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All Groq models exhausted");
}

export interface ToolExecutedAction {
  name: string;
  args: any;
  result: any;
}

export async function runAssistantTurn({
  systemPrompt,
  userPrompt,
  tools,
  executeTool,
  maxToolRounds = 4,
}: {
  systemPrompt: string;
  userPrompt: string;
  tools?: any[];
  executeTool: (name: string, args: any) => Promise<any>;
  maxToolRounds?: number;
}): Promise<{ reply: string; actions: ToolExecutedAction[]; modelUsed: string }> {
  const messages: GroqMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
  const actions: ToolExecutedAction[] = [];
  const groqTools = toGroqTools(tools);

  let currentOrder = getModelOrder();
  let modelUsed = currentOrder[0];

  for (let round = 0; round < maxToolRounds; round++) {
    const { data, modelUsed: usedThisRound } = await callGroqWithFallback(
      currentOrder,
      messages,
      groqTools
    );
    modelUsed = usedThisRound;
    currentOrder = [usedThisRound, ...MODEL_POOL.filter((m) => m !== usedThisRound)];

    const msg = data.choices?.[0]?.message;
    const toolCalls: ToolCall[] = msg?.tool_calls ?? [];

    if (toolCalls.length === 0) {
      return { reply: msg?.content ?? "", actions, modelUsed };
    }

    // The assistant message with ALL its tool_calls must be echoed back first
    messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: toolCalls });

    // Every tool_call needs its own "tool" reply (Gemini code only handled the first)
    for (const call of toolCalls) {
      let args: any = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        /* malformed args → run with {} and let the tool return its own error */
      }
      const result = await executeTool(call.function.name, args);
      actions.push({ name: call.function.name, args, result });
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  return {
    reply: "I took a few actions but I'm not able to summarize the result right now — check your task list.",
    actions,
    modelUsed,
  };
}