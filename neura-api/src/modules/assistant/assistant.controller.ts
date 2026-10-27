import type { Request, Response } from "express";
import { AssistantBusyError } from "@/lib/groq";
import { askAssistant, type AssistantRequest } from "@/modules/assistant/assistant.service";

// POST /api/assistant  { mode, question?, history?, references?, clientDate?, timeZone? }
export async function postMessage(req: Request, res: Response) {
  try {
    res.json(await askAssistant(req.userId!, req.body as AssistantRequest));
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
