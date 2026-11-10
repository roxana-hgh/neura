import type { Request, Response } from "express";
import { AssistantBusyError } from "@/lib/groq";
import { z } from "zod";
import { askAssistant } from "@/modules/assistant/assistant.service";
import { dayKey, parse } from "@/utils/validate";

// Only the last turns reach the prompt (and are clipped there), so long histories are cut here
const MAX_HISTORY = 6;

const assistantBody = z.object({
  mode: z.string({ error: "is required" }).max(40),
  question: z.string().max(4000, "must be 4000 characters or less").optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(20_000),
  })).max(500).optional().transform((h) => h?.slice(-MAX_HISTORY)),
  // types and ids are filtered again by safeReferences
  references: z.array(z.object({
    id: z.string().max(64),
    title: z.string().max(300),
    type: z.enum(["task", "habit", "goal", "note", "reminder", "brainstorm"]),
  })).max(20).optional(),
  clientDate: dayKey.optional().catch(undefined),
  timeZone: z.string().max(64).optional().catch(undefined),
});

// POST /api/assistant  { mode, question?, history?, references?, clientDate?, timeZone? }
export async function postMessage(req: Request, res: Response) {
  const request = parse(assistantBody, req.body);
  try {
    res.json(await askAssistant(req.userId!, request));
  } catch (err) {
    if (err instanceof AssistantBusyError) {
      res.set("Retry-After", String(err.retryAfterSec));
      return res.status(503).json({
        error: "busy",
        message:
          "The assistant is a bit busy right now. Try again in a moment.",
        retryAfterSec: err.retryAfterSec,
      });
    }
    console.error("Assistant error:", err);
    res.status(500).json({ error: "Failed to generate response" });
  }
}
