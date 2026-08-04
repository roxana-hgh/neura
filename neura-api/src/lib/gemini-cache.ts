const CACHED_CONTENTS_URL = "https://generativelanguage.googleapis.com/v1beta/cachedContents";

// How long Google holds the cached prefix. Longer = fewer re-creates but more
// storage cost; shorter = cheaper storage but more re-creates. 1 hour is a
// reasonable default for a chat assistant used in bursts throughout the day.
const CACHE_TTL_SECONDS = 3600;

// Refresh a bit before actual expiry so we never race a request against an
// expiring cache.
const REFRESH_BUFFER_MS = 60_000;

interface CacheEntry {
  name: string; // e.g. "cachedContents/abc123"
  expiresAt: number; // epoch ms
}

// Keyed by `${model}:${hash(systemPrompt+tools)}` — a cache is tied to one
// specific model, so each model in the rotation pool gets its own entry.
const cacheStore = new Map<string, CacheEntry>();

function hashText(text: string): string {
  // Cheap, stable, non-crypto hash — this is just a cache key, not security-sensitive.
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

/**
 * Returns a cachedContent resource name to reuse for this model/prompt/tools
 * combo, creating one if needed. Returns null if caching isn't possible
 * (most commonly: the prompt is below the model's minimum cacheable token
 * count — Gemini requires roughly 1k-4k tokens depending on the model). null
 * just means "send it inline this time," it's not a failure worth surfacing.
 */
export async function getOrCreateCache(
  model: string,
  systemPrompt: string,
  tools?: any[]
): Promise<string | null> {
  const key = `${model}:${hashText(systemPrompt + JSON.stringify(tools ?? []))}`;
  const existing = cacheStore.get(key);
  if (existing && existing.expiresAt > Date.now() + REFRESH_BUFFER_MS) {
    return existing.name;
  }

  try {
    const res = await fetch(`${CACHED_CONTENTS_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${model}`,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        ...(tools ? { tools } : {}),
        ttl: `${CACHE_TTL_SECONDS}s`,
      }),
    });

    if (!res.ok) {
      // Too small to cache, model doesn't support caching, transient error, etc.
      // Not fatal — caller falls back to sending the prompt inline.
      return null;
    }

    const data = await res.json();
    cacheStore.set(key, {
      name: data.name,
      expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000,
    });
    return data.name;
  } catch {
    return null;
  }
}