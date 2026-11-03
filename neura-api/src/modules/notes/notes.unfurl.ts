/**
 * Link previews for the note editor's link cards. Only well-known oEmbed endpoints are called, and the
 * user's URL is only ever passed to them as a query parameter, so this can't be used to reach other hosts.
 */

export interface LinkPreview {
  title: string | null;
  author: string | null;
  thumbnail: string | null;
  /** Body text, for posts (a tweet's text) */
  text: string | null;
}

interface Provider {
  hosts: string[];
  endpoint: (url: string) => string;
}

const enc = encodeURIComponent;

const PROVIDERS: Provider[] = [
  {
    hosts: ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"],
    endpoint: (url) => `https://www.youtube.com/oembed?format=json&url=${enc(url)}`,
  },
  {
    hosts: ["twitter.com", "www.twitter.com", "mobile.twitter.com", "x.com", "www.x.com"],
    // the endpoint only knows twitter.com URLs
    endpoint: (url) =>
      `https://publish.twitter.com/oembed?omit_script=1&dnt=1&url=${enc(url.replace(/\/\/(www\.|mobile\.)?x\.com\//, "//twitter.com/"))}`,
  },
  { hosts: ["vimeo.com", "www.vimeo.com"], endpoint: (url) => `https://vimeo.com/api/oembed.json?url=${enc(url)}` },
  { hosts: ["open.spotify.com"], endpoint: (url) => `https://open.spotify.com/oembed?url=${enc(url)}` },
  { hosts: ["soundcloud.com", "www.soundcloud.com", "m.soundcloud.com"], endpoint: (url) => `https://soundcloud.com/oembed?format=json&url=${enc(url)}` },
];

const CACHE_LIMIT = 300;
const cache = new Map<string, LinkPreview | null>();

const decode = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Whether `url` is an http(s) link to a host we have an oEmbed endpoint for. */
export function findProvider(url: string): Provider | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  const host = parsed.hostname.toLowerCase();
  return PROVIDERS.find((p) => p.hosts.includes(host)) ?? null;
}

/** oEmbed metadata for a supported link, or null (unsupported, private, deleted, or the provider is down). */
export async function unfurl(url: string): Promise<LinkPreview | null> {
  const provider = findProvider(url);
  if (!provider) return null;
  if (cache.has(url)) return cache.get(url)!;

  let preview: LinkPreview | null = null;
  // a 4xx (private / deleted) is final; network errors and 5xx may work next time
  let cacheable = false;
  try {
    const res = await fetch(provider.endpoint(url), {
      signal: AbortSignal.timeout(5000),
      headers: { accept: "application/json" },
    });
    cacheable = res.status < 500;
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      const html = str(data.html);
      // tweets come back as <blockquote><p>text</p>— Name (@handle) …</blockquote>
      const tweet = html && /<p[^>]*>([\s\S]*?)<\/p>/i.exec(html);
      preview = {
        title: str(data.title),
        author: str(data.author_name),
        thumbnail: str(data.thumbnail_url),
        text: tweet ? decode(tweet[1]).slice(0, 600) : null,
      };
    }
  } catch {
    // timeouts and network errors just mean "no preview"
  }

  if (cacheable) {
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
    cache.set(url, preview);
  }
  return preview;
}
