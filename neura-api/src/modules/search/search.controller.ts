import type { Request, Response } from "express";
import { z } from "zod";
import * as searchService from "@/modules/search/search.service";
import { SEARCH_TYPES, type SearchType } from "@/modules/search/search.service";
import { parse, queryInt, requiredText } from "@/utils/validate";

const MAX_QUERY = 100;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;

const searchQuery = z.object({
  q: requiredText(MAX_QUERY),
  types: z.string().optional().catch(undefined).transform((v, ctx) => {
    if (!v) return [...SEARCH_TYPES];
    const types = v.split(",").filter((t): t is SearchType => SEARCH_TYPES.includes(t as SearchType));
    if (!types.length) ctx.addIssue({ code: "custom", message: `must be any of ${SEARCH_TYPES.join(", ")}` });
    return types;
  }),
  limit: queryInt.transform((n) => (n && n > 0 ? Math.min(n, MAX_LIMIT) : DEFAULT_LIMIT)),
});

// GET /api/search?q=&types=tasks,notes&limit=
export async function search(req: Request, res: Response) {
  const { q, types, limit } = parse(searchQuery, req.query);
  res.json(await searchService.searchEverything(req.userId!, q, { perType: limit, types }));
}
