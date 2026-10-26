const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Limits per model (your org): 30 RPM, 1K RPD, 8K TPM, 200K TPD — each model has its own quota.
const MODEL_POOL = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b", // preview model — may be discontinued without notice
] as const;

const REQUEST_TIMEOUT_MS = 25_000;
// Groq counts requested completion tokens toward TPM, so keep this modest.
const MAX_COMPLETION_TOKENS = 1500;
const MAX_TOOL_RESULT_CHARS = 6000;
const SHORT_WAIT_MAX_MS = 3000; // wait + retry same model only if the limit resets this fast
const DEFAULT_COOLDOWN_MS = 15_000;
const MAX_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const APPROX_TOKEN_WARN = 6000; // warn when a single request nears the 8K TPM cap

// ---------- Errors ----------

/** A failure that is worth trying on another model. */
class RetryableModelError extends Error {
  cooldownMs: number;
  waitable: boolean;
  constructor(message: string, cooldownMs = 0, waitable = false) {
    super(message);
    this.cooldownMs = cooldownMs;
    this.waitable = waitable;
  }
}

/** Thrown when every model is rate-limited / unavailable right now. */
export class AssistantBusyError extends Error {
  retryAfterSec: number;
  constructor(retryAfterSec: number) {
    super(`All assistant models are busy. Retry in ~${retryAfterSec}s`);
    this.retryAfterSec = retryAfterSec;
  }
}

// ---------- Model rotation + cooldowns ----------

let rotationCursor = 0;
function getModelOrder(): string[] {
  const start = rotationCursor % MODEL_POOL.length;
  rotationCursor++;
  return [...MODEL_POOL.slice(start), ...MODEL_POOL.slice(0, start)];
}

// model -> epoch ms until which we skip it (set from 429 retry-after etc.)
const cooldownUntil = new Map<string, number>();
const isCoolingDown = (model: string) => (cooldownUntil.get(model) ?? 0) > Date.now();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function soonestRetrySec(): number {
  const waits = MODEL_POOL.map((m) => (cooldownUntil.get(m) ?? 0) - Date.now()).filter((w) => w > 0);
  return waits.length ? Math.ceil(Math.min(...waits) / 1000) : 5;
}

// ---------- Types ----------

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

type GroqMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export interface ToolExecutedAction {
  name: string;
  args: any;
  result: any;
}

// ---------- Helpers ----------

// Converts Gemini-style [{ functionDeclarations: [...] }] into OpenAI/Groq-style tools,
// so task-tools.service.ts and habit-tools.service.ts stay untouched.
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

function serializeToolResult(result: any): string {
  const json = JSON.stringify(result ?? null);
  return json.length > MAX_TOOL_RESULT_CHARS
    ? json.slice(0, MAX_TOOL_RESULT_CHARS) + '… [truncated]'
    : json;
}

// Qwen may include <think>…</think> reasoning in content; never show it to the user.
function cleanReply(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

// ---------- Single model call ----------

async function callGroqModel(model: string, messages: GroqMessage[], tools?: any[]) {
  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6,
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        // gpt-oss models reason by default; "low" saves tokens/latency (don't send to Qwen)
        ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
        ...(tools?.length ? { tools, tool_choice: "auto" } : {}),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // Network error or timeout
    throw new RetryableModelError(`${model} network/timeout: ${(err as Error).message}`, 5_000);
  }

  if (res.ok) return res.json();

  const text = await res.text();

  if (res.status === 429) {
    const sec = parseFloat(res.headers.get("retry-after") ?? "");
    const ms = Number.isFinite(sec)
      ? Math.min(Math.ceil(sec * 1000), MAX_COOLDOWN_MS)
      : DEFAULT_COOLDOWN_MS;
    throw new RetryableModelError(`${model} rate limited (retry in ~${Math.ceil(ms / 1000)}s)`, ms, true);
  }
  if (res.status === 413) {
    // Request exceeds this model's TPM — another model may have a fresh window
    throw new RetryableModelError(`${model} request too large (413)`, 0);
  }
  if (res.status >= 500) {
    throw new RetryableModelError(`${model} server error (${res.status})`, 5_000);
  }
  if (res.status === 404 && text.includes("model_not_found")) {
    throw new RetryableModelError(`${model} not available on this account`, 10 * 60_000);
  }
  if (res.status === 400 && text.includes("tool_use_failed")) {
    throw new RetryableModelError(`${model} produced a malformed tool call`, 0);
  }
  if (res.status === 401) {
    throw new Error("Groq API key is missing or invalid (401). Check GROQ_API_KEY.");
  }

  throw new Error(`Groq API error (${model}): ${res.status} ${text}`);
}

// ---------- Fallback across models ----------

async function callGroqWithFallback(order: string[], messages: GroqMessage[], tools?: any[]) {
  for (const model of order) {
    if (isCoolingDown(model)) continue;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const data = await callGroqModel(model, messages, tools);
        return { data, modelUsed: model };
      } catch (err) {
        if (!(err instanceof RetryableModelError)) throw err; // config/bad-request errors: fail fast

        console.warn(`[assistant] ${err.message}`);

        // Limit resets almost immediately → wait and retry this same model once
        if (err.waitable && err.cooldownMs <= SHORT_WAIT_MAX_MS && attempt === 0) {
          await sleep(err.cooldownMs + 100);
          continue;
        }
        if (err.cooldownMs > 0) cooldownUntil.set(model, Date.now() + err.cooldownMs);
        break; // next model
      }
    }
  }

  throw new AssistantBusyError(soonestRetrySec());
}

// ---------- Public API ----------

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
  const toolsSize = JSON.stringify(groqTools ?? []).length;

  let currentOrder = getModelOrder();
  let modelUsed = currentOrder[0];

  for (let round = 0; round < maxToolRounds; round++) {
    const approxTokens = Math.ceil((JSON.stringify(messages).length + toolsSize) / 3.5);
    if (approxTokens > APPROX_TOKEN_WARN) {
      console.warn(`[assistant] request ≈${approxTokens} tokens — close to the 8K TPM limit`);
    }

    const { data, modelUsed: usedThisRound } = await callGroqWithFallback(
      currentOrder,
      messages,
      groqTools
    );
    modelUsed = usedThisRound;
    // Stick with the winning model for the remaining rounds, others stay as fallbacks
    currentOrder = [usedThisRound, ...MODEL_POOL.filter((m) => m !== usedThisRound)];

    console.log(
      `[assistant] ${modelUsed} round=${round} tokens=${data.usage?.total_tokens ?? "?"}`
    );

    const msg = data.choices?.[0]?.message;
    const toolCalls: ToolCall[] = msg?.tool_calls ?? [];

    if (toolCalls.length === 0) {
      const reply =
        cleanReply(msg?.content ?? "") ||
        "Sorry, I couldn't put together a reply just now. Could you try again?";
      return { reply, actions, modelUsed };
    }

    // Echo the assistant message with ALL its tool_calls, then answer each one
    messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: toolCalls });

    for (const call of toolCalls) {
      let args: any = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        /* malformed args → run with {} and let the tool report its own error */
      }

      let result: any;
      try {
        result = await executeTool(call.function.name, args);
      } catch (err) {
        console.error(`[assistant] tool ${call.function.name} failed:`, err);
        result = { error: "Tool execution failed." };
      }

      actions.push({ name: call.function.name, args, result });
      messages.push({ role: "tool", tool_call_id: call.id, content: serializeToolResult(result) });
    }
  }

  return {
    reply: "I took a few actions but I'm not able to summarize the result right now — check your task list.",
    actions,
    modelUsed,
  };
}