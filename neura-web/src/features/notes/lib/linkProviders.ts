/**
 * Recognizes what a pasted link points to (a YouTube video, a post on X, an Instagram reel, …) so the
 * editor can show it as a labelled card instead of a bare URL. Pure functions, no network.
 */

export type LinkProviderId =
  | "youtube"
  | "x"
  | "instagram"
  | "tiktok"
  | "vimeo"
  | "spotify"
  | "soundcloud"
  | "github"
  | "linkedin"
  | "reddit"
  | "telegram"
  | "facebook"
  | "threads"
  | "aparat"
  | "medium"
  | "web";

export interface LinkInfo {
  url: string;
  provider: LinkProviderId;
  /** Brand name shown on the card, e.g. "YouTube" */
  name: string;
  /** What it is, e.g. "Video", "Post", "Reel", "Repository" */
  kind: string;
  /** Account / channel when the URL contains it, e.g. "@nasa" */
  handle: string | null;
  /** Domain without "www." */
  domain: string;
  /** Inline player URL for providers that allow embedding */
  embedUrl: string | null;
  /** Thumbnail that needs no API call */
  thumbnail: string | null;
  /** The API can fetch a title / author / post text for it */
  canUnfurl: boolean;
}

export function parseUrl(raw: string): URL | null {
  const text = raw.trim();
  if (!text || /\s/.test(text)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    // "foo" alone isn't a link; require a dot in the host
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

/** A string that is only a URL (what the paste handler turns into a card). */
export const isStandaloneUrl = (text: string) => /^https?:\/\/\S+$/i.test(text.trim()) && !!parseUrl(text);

const segments = (url: URL) => url.pathname.split("/").filter(Boolean);
const at = (name: string | undefined) => (name ? `@${name.replace(/^@/, "")}` : null);

function youtubeId(url: URL, host: string): string | null {
  if (host === "youtu.be") return segments(url)[0] ?? null;
  const [first, second] = segments(url);
  if (first === "watch") return url.searchParams.get("v");
  if (["shorts", "embed", "live", "v"].includes(first ?? "")) return second ?? null;
  return url.searchParams.get("v");
}

export function detectLink(raw: string): LinkInfo | null {
  const url = parseUrl(raw);
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.|mobile\.)/, "");
  const parts = segments(url);
  const base = { url: url.href, domain: host, handle: null, embedUrl: null, thumbnail: null, canUnfurl: false };

  if (host === "youtube.com" || host === "youtu.be" || host === "music.youtube.com") {
    const id = youtubeId(url, host);
    const short = parts[0] === "shorts";
    if (id && /^[\w-]{6,}$/.test(id)) {
      return {
        ...base,
        provider: "youtube",
        name: "YouTube",
        kind: short ? "Short" : "Video",
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        canUnfurl: true,
      };
    }
    const channel = parts[0]?.startsWith("@") ? parts[0] : null;
    return {
      ...base,
      provider: "youtube",
      name: "YouTube",
      kind: parts[0] === "playlist" ? "Playlist" : channel || parts[0] === "channel" || parts[0] === "c" ? "Channel" : "Link",
      handle: channel,
    };
  }

  if (host === "x.com" || host === "twitter.com") {
    const [user, type] = parts;
    const isPost = type === "status";
    return {
      ...base,
      provider: "x",
      name: "X",
      kind: isPost ? "Post" : user ? "Profile" : "Link",
      handle: user && !["i", "home", "search", "explore"].includes(user) ? at(user) : null,
      canUnfurl: isPost,
    };
  }

  if (host === "instagram.com") {
    const [first, second] = parts;
    const kinds: Record<string, string> = { p: "Post", reel: "Reel", reels: "Reel", tv: "Video", stories: "Story" };
    const kind = kinds[first ?? ""];
    return {
      ...base,
      provider: "instagram",
      name: "Instagram",
      kind: kind ?? (first ? "Profile" : "Link"),
      handle: first === "stories" ? at(second) : kind ? null : at(first),
    };
  }

  if (host === "tiktok.com" || host === "vm.tiktok.com") {
    const user = parts.find((p) => p.startsWith("@"));
    return { ...base, provider: "tiktok", name: "TikTok", kind: parts.includes("video") ? "Video" : user ? "Profile" : "Video", handle: user ?? null };
  }

  if (host === "vimeo.com") {
    const id = parts.find((p) => /^\d+$/.test(p));
    return {
      ...base,
      provider: "vimeo",
      name: "Vimeo",
      kind: id ? "Video" : "Link",
      embedUrl: id ? `https://player.vimeo.com/video/${id}` : null,
      canUnfurl: !!id,
    };
  }

  if (host === "open.spotify.com") {
    const type = parts.find((p) => ["track", "album", "playlist", "episode", "show", "artist"].includes(p));
    const kinds: Record<string, string> = { track: "Song", album: "Album", playlist: "Playlist", episode: "Episode", show: "Podcast", artist: "Artist" };
    return { ...base, provider: "spotify", name: "Spotify", kind: type ? kinds[type] : "Link", canUnfurl: !!type };
  }

  if (host === "soundcloud.com") {
    return { ...base, provider: "soundcloud", name: "SoundCloud", kind: parts.length > 1 ? "Track" : "Artist", handle: at(parts[0]), canUnfurl: parts.length > 0 };
  }

  if (host === "github.com" || host === "gist.github.com") {
    const [owner, repo, type, num] = parts;
    const kind = host === "gist.github.com" ? "Gist"
      : type === "pull" ? `Pull request #${num ?? ""}`.trim()
      : type === "issues" && num ? `Issue #${num}`
      : repo ? "Repository"
      : owner ? "Profile" : "Link";
    return { ...base, provider: "github", name: "GitHub", kind, handle: owner && repo ? `${owner}/${repo}` : at(owner) };
  }

  if (host === "linkedin.com") {
    const [first, second] = parts;
    const kind = first === "in" ? "Profile" : first === "company" ? "Company" : first === "jobs" ? "Job" : first === "posts" || first === "feed" ? "Post" : "Link";
    return { ...base, provider: "linkedin", name: "LinkedIn", kind, handle: first === "in" || first === "company" ? second ?? null : null };
  }

  if (host === "reddit.com" || host === "old.reddit.com" || host === "redd.it") {
    const sub = parts[0] === "r" ? `r/${parts[1]}` : null;
    return { ...base, provider: "reddit", name: "Reddit", kind: parts.includes("comments") ? "Post" : sub ? "Community" : "Link", handle: sub };
  }

  if (host === "t.me" || host === "telegram.me") {
    return { ...base, provider: "telegram", name: "Telegram", kind: parts.length > 1 ? "Post" : "Channel", handle: at(parts[0]) };
  }

  if (host === "facebook.com" || host === "fb.watch") {
    return { ...base, provider: "facebook", name: "Facebook", kind: parts.includes("videos") || host === "fb.watch" ? "Video" : parts.includes("posts") ? "Post" : "Link" };
  }

  if (host === "threads.net" || host === "threads.com") {
    return { ...base, provider: "threads", name: "Threads", kind: parts.includes("post") ? "Post" : "Profile", handle: parts[0]?.startsWith("@") ? parts[0] : null };
  }

  if (host === "aparat.com") {
    const id = parts[0] === "v" ? parts[1] : null;
    return {
      ...base,
      provider: "aparat",
      name: "Aparat",
      kind: id ? "Video" : "Link",
      embedUrl: id ? `https://www.aparat.com/video/video/embed/videohash/${id}/vt/frame` : null,
    };
  }

  if (host === "medium.com" || host.endsWith(".medium.com")) {
    return { ...base, provider: "medium", name: "Medium", kind: "Article", handle: parts[0]?.startsWith("@") ? parts[0] : null };
  }

  return { ...base, provider: "web", name: host, kind: "Website" };
}

/** Readable fallback title from the URL path: "/blog/my-first-post" → "my first post" */
export function titleFromUrl(raw: string): string {
  const url = parseUrl(raw);
  if (!url) return raw;
  const last = segments(url).at(-1);
  if (!last) return url.hostname.replace(/^www\./, "");
  try {
    return decodeURIComponent(last).replace(/\.[a-z]{2,5}$/i, "").replace(/[-_]+/g, " ");
  } catch {
    return last;
  }
}
