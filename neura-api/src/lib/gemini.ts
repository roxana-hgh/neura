import { getOrCreateCache } from "./gemini-cache";



const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Ordered by preference. First entry is tried first (via rotation, see below);
// the rest are fallbacks if a model returns 429 (daily/rate limit hit).
// TTS is intentionally excluded — it doesn't support the function-calling / text
// generateContent flow this assistant uses.
const MODEL_POOL = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

// Round-robins which model starts the rotation on each call to callGemini.
// This spreads normal traffic across all 7 models' separate daily quotas
// instead of always hitting the first one until it 429s.
// NOTE: this counter is per-process/in-memory. On Render with a single
// backend instance that's fine; if you ever scale to multiple instances
// each will keep its own counter, which still spreads load, just not
// perfectly evenly.
let rotationCursor = 0;
function getModelOrder(): string[] {
  const start = rotationCursor % MODEL_POOL.length;
  rotationCursor++;
  return [...MODEL_POOL.slice(start), ...MODEL_POOL.slice(0, start)];
}

class GeminiRateLimitError extends Error {}

interface GeminiPart {
  text?: string;
  functionCall?: { id?: string; name: string; args: any };
  functionResponse?: { id?: string; name: string; response: any };
  thoughtSignature?: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

// Gemini 3.x models use `thinkingLevel`; 2.5 models use the older `thinkingBudget`.
// Setting both to their respective "off/minimal" values cuts the hidden reasoning
// tokens Gemini would otherwise generate before every tool call or reply —
// this is the single biggest token/cost lever available per-request.
function buildGenerationConfig(model: string) {
  const is3x = /^gemini-3/.test(model);
  return {
    thinkingConfig: is3x ? { thinkingLevel: "minimal" } : { thinkingBudget: 0 },
  };
}

async function callGeminiModel(
  model: string,
  systemPrompt: string,
  contents: GeminiContent[],
  tools?: any[]
) {
  // If the system prompt + tools are already cached on Google's side for this
  // model, skip re-sending (and re-paying for) them entirely — only the live
  // conversation turns get sent. Falls back to the normal inline request if
  // caching isn't available for this prompt (e.g. too short to cache).
  const cachedContent = await getOrCreateCache(model, systemPrompt, tools);

  const body = cachedContent
    ? {
        cachedContent,
        contents,
        generationConfig: buildGenerationConfig(model),
      }
    : {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: buildGenerationConfig(model),
        ...(tools ? { tools } : {}),
      };

  const res = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    throw new GeminiRateLimitError(`${model} rate limited`);
  }
  if (!res.ok) {
    throw new Error(`Gemini API error (${model}): ${res.status} ${await res.text()}`);
  }

  return res.json();
}

/**
 * Tries models in `order` until one succeeds. Only 429s trigger a fallback —
 * any other error (bad request, auth, etc.) throws immediately since retrying
 * on a different model won't fix it.
 */
async function callGeminiWithFallback(
  order: string[],
  systemPrompt: string,
  contents: GeminiContent[],
  tools?: any[]
): Promise<{ data: any; modelUsed: string }> {
  let lastError: unknown;

  for (const model of order) {
    try {
      const data = await callGeminiModel(model, systemPrompt, contents, tools);
      return { data, modelUsed: model };
    } catch (err) {
      lastError = err;
      if (err instanceof GeminiRateLimitError) {
        console.warn(`[assistant] ${model} rate-limited, falling back to next model`);
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All Gemini models exhausted (rate limited)");
}

export interface ToolExecutedAction {
  name: string;
  args: any;
  result: any;
}

/**
 * Runs the conversation, letting Gemini call tools as needed.
 * `executeTool` is provided by the caller so this file stays DB-agnostic.
 */
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
  const contents: GeminiContent[] = [{ role: "user", parts: [{ text: userPrompt }] }];
  const actions: ToolExecutedAction[] = [];

  // Pick the rotation order once per turn and stick with whichever model wins
  // for the rest of the tool-calling loop. Switching models mid-loop is best
  // avoided because thoughtSignature handling differs between Gemini 3.x and
  // 2.5, and there's no side-effect risk from just keeping the same model
  // once it's confirmed to be working.
  const order = getModelOrder();
  let currentOrder = order;
  let modelUsed = order[0];

  for (let round = 0; round < maxToolRounds; round++) {
    const { data, modelUsed: usedThisRound } = await callGeminiWithFallback(
      currentOrder,
      systemPrompt,
      contents,
      tools
    );
    modelUsed = usedThisRound;
    // Once a model has won, don't re-try ones before it on subsequent rounds.
    currentOrder = [usedThisRound, ...MODEL_POOL.filter((m) => m !== usedThisRound)];

    const candidateParts: GeminiPart[] = data.candidates?.[0]?.content?.parts ?? [];
    const functionCallPart = candidateParts.find((p) => p.functionCall);

    if (!functionCallPart?.functionCall) {
      // No tool call — this is the final answer
      const text = candidateParts.map((p) => p.text ?? "").join("");
      return { reply: text, actions, modelUsed };
    }

    const { name, args } = functionCallPart.functionCall;
    // Gemini 3.5+/3.6 require id + matching name on both the functionCall and its
    // functionResponse (older models ignore id entirely, so it's safe either way).
    const callId = functionCallPart.functionCall.id ?? `${name}-${round}`;
    const result = await executeTool(name, args);
    actions.push({ name, args, result });

    // Record the model's turn (the call it made) and our reply (the result).
    // Gemini 3 requires the thoughtSignature to be echoed back exactly as received;
    // older models (2.5 and earlier) simply won't include one, which is fine.
    contents.push({
      role: "model",
      parts: [
        {
          functionCall: { id: callId, name, args },
          thoughtSignature: functionCallPart.thoughtSignature ?? "skip_thought_signature_validator",
        },
      ],
    });
    contents.push({
      role: "user",
      parts: [{ functionResponse: { id: callId, name, response: { content: result } } }],
    });
  }

  return {
    reply: "I took a few actions but I'm not able to summarize the result right now — check your task list.",
    actions,
    modelUsed,
  };
}