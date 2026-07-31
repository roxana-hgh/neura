const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: any };
  functionResponse?: { name: string; response: any };
  thoughtSignature?: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

async function callGemini(systemPrompt: string, contents: GeminiContent[], tools?: any[]) {
  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      ...(tools ? { tools } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  }

  return res.json();
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
}): Promise<{ reply: string; actions: ToolExecutedAction[] }> {
  const contents: GeminiContent[] = [{ role: "user", parts: [{ text: userPrompt }] }];
  const actions: ToolExecutedAction[] = [];

  for (let round = 0; round < maxToolRounds; round++) {
    const data = await callGemini(systemPrompt, contents, tools);
    const candidateParts: GeminiPart[] = data.candidates?.[0]?.content?.parts ?? [];

    const functionCallPart = candidateParts.find((p) => p.functionCall);

    if (!functionCallPart?.functionCall) {
      // No tool call — this is the final answer
      const text = candidateParts.map((p) => p.text ?? "").join("");
      return { reply: text, actions };
    }

    const { name, args } = functionCallPart.functionCall;
    const result = await executeTool(name, args);
    actions.push({ name, args, result });

    // Record the model's turn (the call it made) and our reply (the result).
    // Gemini 3 requires the thoughtSignature to be echoed back exactly as received;
    // older models (2.5 and earlier) simply won't include one, which is fine.
    contents.push({
      role: "model",
      parts: [
        {
          functionCall: { name, args },
          thoughtSignature: functionCallPart.thoughtSignature ?? "skip_thought_signature_validator",
        },
      ],
    });
    contents.push({
      role: "user",
      parts: [{ functionResponse: { name, response: { content: result } } }],
    });
  }

  return {
    reply: "I took a few actions but I'm not able to summarize the result right now — check your task list.",
    actions,
  };
}