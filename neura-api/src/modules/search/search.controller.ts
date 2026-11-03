import type { Request, Response } from "express";
import * as searchService from "@/modules/search/search.service";
import { SEARCH_TYPES, type SearchType } from "@/modules/search/search.service";

const MAX_QUERY = 100;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;

// GET /api/search?q=&types=tasks,notes&limit=
export async function search(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) {
    res.status(400).json({ error: "q is required" });
    return;
  }
  if (q.length > MAX_QUERY) {
    res.status(400).json({ error: `q must be ${MAX_QUERY} characters or less` });
    return;
  }

  let types: SearchType[] = [...SEARCH_TYPES];
  if (typeof req.query.types === "string" && req.query.types) {
    types = req.query.types.split(",").filter((t): t is SearchType => SEARCH_TYPES.includes(t as SearchType));
    if (!types.length) {
      res.status(400).json({ error: `types must be any of ${SEARCH_TYPES.join(", ")}` });
      return;
    }
  }

  const limit = Number(req.query.limit);
  const perType = Number.isInteger(limit) && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;

  res.json(await searchService.searchEverything(req.userId!, q, { perType, types }));
}
