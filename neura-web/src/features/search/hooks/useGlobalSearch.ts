import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SearchResponse } from "@/features/search/types/search";

export const MIN_QUERY = 2;
const DEBOUNCE_MS = 200;

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** GET /search, debounced. Keeps the last results on screen while the next query loads. */
export function useGlobalSearch(query: string) {
  const q = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const enabled = q.length >= MIN_QUERY;

  const result = useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      const { data } = await api.get<SearchResponse>("/search", { params: { q } });
      return data;
    },
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  return {
    ...result,
    debouncedQuery: q,
    enabled,
    // typed ahead of the debounce, or the request is in flight
    isSearching: query.trim().length >= MIN_QUERY && (q !== query.trim() || result.isFetching),
  };
}
