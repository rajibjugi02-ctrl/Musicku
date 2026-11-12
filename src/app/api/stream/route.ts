import { NextRequest, NextResponse } from "next/server";

interface StreamResult {
  streamUrl: string;
  proxyUrl?: string;
  duration: number; // milliseconds
  source: "youtube" | "jiosaavn";
  isFallback: false;
  bitrate?: number;
}

// In-memory server cache with 30-minute TTL
const streamCache = new Map<string, { result: StreamResult; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

// CDNs that support direct browser byte-range streaming without server proxy
const DIRECT_SAFE_CDNS = [
  "saavncdn.com",
  "jiosaavn.com",
  "akamaized.net",
  "cloudfront.net",
  "googlevideo.com",
];

function isSafeDirectCDN(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return DIRECT_SAFE_CDNS.some((cdn) => hostname.endsWith(cdn));
  } catch {
    return false;
  }
}

function resolvePlaybackUrl(url: string): { streamUrl: string; proxyUrl: string } {
  if (isSafeDirectCDN(url)) {
    // Direct CDN bypass: let the browser stream directly for sub-300ms latency
    return { streamUrl: url, proxyUrl: url };
  }
  // Fall back to server proxy for restricted/CORS hosts
  return { streamUrl: url, proxyUrl: `/api/stream/proxy?url=${encodeURIComponent(url)}` };
}

export function cleanTrackQuery(title: string, artist: string): { cleanTitle: string; cleanArtist: string } {
  let cleanTitle = (title || "")
    .replace(/\s*[\(\[](?:feat\.?|ft\.?|with|prod\.?|remastered|deluxe|bonus|version|explicit|official|audio).*?[\)\]]/gi, "")
    .replace(/\s*-\s*(?:remastered|remaster|\d{4}\s*remaster|live|radio edit|deluxe|bonus track|single version).*/gi, "")
    .replace(/[-–—/]+$/, "")
    .trim();

  let cleanArtist = (artist || "")
    .replace(/\s*[\(\[](?:feat\.?|ft\.?|with).*?[\)\]]/gi, "")
    .replace(/\s*,\s*/g, " ")
    .replace(/\s+&\s+/g, " ")
    .trim();

  if (!cleanTitle) cleanTitle = (title || "").trim();
  if (!cleanArtist) cleanArtist = (artist || "").trim();

  return { cleanTitle, cleanArtist };
}

const VERIFIED_YOUTUBE_NODES = [
  "https://yt.chocolatemoo53.com",
  "https://inv.tux.pizza",
  "https://invidious.nerdvpn.de",
];

const SAAVN_CLUSTERS = [
  "https://saavn.dev/api/search/songs",
  "https://jiosaavn-api-private.vercel.app/search/songs",
];

function scoreStreamCandidate(
  title: string,
  author: string,
  candidateDurationSec: number,
  cleanTitle: string,
  cleanArtist: string,
  targetDurationSec: number
): number {
  const titleLower = (title || "").toLowerCase();
  const authorLower = (author || "").toLowerCase();
  const artistLower = cleanArtist.toLowerCase().trim();
  const cleanTitleLower = cleanTitle.toLowerCase().trim();

  let score = 0;

  // 1. Primary artist matching
  if (authorLower.includes(artistLower) || titleLower.includes(artistLower)) {
    score += 500;
  } else {
    score -= 400;
  }

  // 2. Strict duration proximity
  if (targetDurationSec > 10 && candidateDurationSec > 0) {
    const diff = Math.abs(candidateDurationSec - targetDurationSec);
    if (diff === 0) score += 1200;
    else if (diff <= 1) score += 1000;
    else if (diff <= 2) score += 800;
    else if (diff <= 3) score += 650;
    else if (diff <= 5) score += 400;
    else if (diff <= 8) score += 200;
    else if (diff <= 15) score += 50;
    else score -= 600;
  }

  // 3. Studio audio boosts (favors official audio & album versions over music videos with dialogue)
  if (
    titleLower.includes("official audio") ||
    titleLower.includes("official lyric video") ||
    titleLower.includes("lyric video") ||
    titleLower.includes("lyrics") ||
    authorLower.endsWith(" - topic") ||
    titleLower.includes("album version")
  ) {
    score += 450;
  }

  // 4. Filter non-studio elements unless specified in clean title
  const nonStudioKeywords = [
    { word: "music video", penalty: 400 },
    { word: "official video", penalty: 400 },
    { word: "live", penalty: 600 },
    { word: "remix", penalty: 500 },
    { word: "cover", penalty: 700 },
    { word: "karaoke", penalty: 700 },
    { word: "instrumental", penalty: 600 },
    { word: "sped up", penalty: 600 },
    { word: "slowed", penalty: 600 },
    { word: "acoustic", penalty: 300 },
    { word: "reaction", penalty: 800 },
    { word: "parody", penalty: 800 },
  ];

  for (const { word, penalty } of nonStudioKeywords) {
    if (!cleanTitleLower.includes(word) && (titleLower.includes(word) || authorLower.includes(word))) {
      score -= penalty;
    }
  }

  return score;
}

/**
 * Provider 1: YouTube Music / Video Search + Adaptive Audio Extractor
 * Strict Full-Track Only (Validates duration >= 60 seconds)
 */
async function fetchFromYouTube(
  cleanTitle: string,
  cleanArtist: string,
  targetDurationSec: number,
  signal: AbortSignal
): Promise<StreamResult> {
  const query = `${cleanArtist} - ${cleanTitle} Official Audio`;

  for (const base of VERIFIED_YOUTUBE_NODES) {
    if (signal.aborted) throw new Error("Aborted");

    try {
      const searchRes = await fetch(
        `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
        {
          signal,
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        }
      );

      if (!searchRes.ok) continue;

      const videos = await searchRes.json();
      if (!Array.isArray(videos) || videos.length === 0) continue;

      // Filter out preview snippets < 45s
      const validVideos = videos.filter(
        (v: { videoId?: string; lengthSeconds?: number }) => (v.lengthSeconds || 0) >= 45
      );
      if (validVideos.length === 0) continue;

      // Score candidates to guarantee original studio track
      const scored = validVideos.map((v: { videoId?: string; title?: string; author?: string; lengthSeconds?: number }) => ({
        video: v,
        score: scoreStreamCandidate(
          v.title || "",
          v.author || "",
          v.lengthSeconds || 0,
          cleanTitle,
          cleanArtist,
          targetDurationSec
        ),
      }));

      scored.sort((a, b) => b.score - a.score);
      const candidate = scored[0].video;

      const videoId = candidate.videoId;
      if (!videoId) continue;

      const videoRes = await fetch(`${base}/api/v1/videos/${videoId}`, {
        signal,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });

      if (!videoRes.ok) continue;

      const videoData = await videoRes.json();
      const lengthSeconds = videoData.lengthSeconds || candidate.lengthSeconds || targetDurationSec;

      // Double-check stream length is a full track
      if (lengthSeconds && lengthSeconds < 60) {
        continue;
      }

      const adaptiveFormats = videoData.adaptiveFormats || [];
      const audioStreams = adaptiveFormats.filter(
        (f: { type?: string; url?: string }) => f.type?.startsWith("audio/") && f.url
      );

      if (audioStreams.length > 0) {
        const chosen =
          audioStreams.find(
            (f: { bitrate?: number }) => (f.bitrate || 0) >= 120000 && (f.bitrate || 0) <= 170000
          ) || audioStreams[0];

        const { streamUrl, proxyUrl } = resolvePlaybackUrl(chosen.url);

        return {
          streamUrl,
          proxyUrl,
          duration: lengthSeconds * 1000,
          source: "youtube",
          isFallback: false,
          bitrate: chosen.bitrate,
        };
      }
    } catch {
      continue;
    }
  }

  throw new Error("No full-track stream found on YouTube nodes");
}

/**
 * Provider 2: Multi-Cluster JioSaavn API Parallel with 160kbps AAC Priority
 * Strict Full-Track Only (Validates duration >= 60 seconds)
 */
async function fetchFromJioSaavn(
  cleanTitle: string,
  cleanArtist: string,
  targetDurationSec: number,
  signal: AbortSignal
): Promise<StreamResult> {
  const query = `${cleanArtist} ${cleanTitle}`.trim();

  const clusterPromises = SAAVN_CLUSTERS.map(async (endpoint) => {
    const param = endpoint.includes("jiosaavn-api-private") ? "q" : "query";
    const res = await fetch(`${endpoint}?${param}=${encodeURIComponent(query)}`, {
      signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) throw new Error(`Saavn cluster error: ${res.status}`);

    const data = await res.json();
    const songs = data.data?.results || data.data || [];
    if (!Array.isArray(songs) || songs.length === 0) {
      throw new Error("No songs in Saavn cluster");
    }

    interface SaavnSongItem {
      name?: string;
      title?: string;
      primaryArtists?: string;
      singers?: string;
      duration?: number | string;
      download_url?: Array<{ quality?: string; link?: string; url?: string }>;
      downloadUrl?: Array<{ quality?: string; link?: string; url?: string }>;
    }

    const validSongs = (songs as SaavnSongItem[]).filter((s) => Number(s.duration || 0) >= 45);
    if (validSongs.length === 0) {
      throw new Error("No full-track songs in Saavn cluster");
    }

    const scored = validSongs.map((s) => ({
      song: s,
      score: scoreStreamCandidate(
        s.name || s.title || "",
        s.primaryArtists || s.singers || "",
        Number(s.duration || 0),
        cleanTitle,
        cleanArtist,
        targetDurationSec
      ),
    }));

    scored.sort((a, b) => b.score - a.score);
    const candidate = scored[0].song;
    const durationSec = Number(candidate.duration || targetDurationSec || 0);
    // Strict duration validation: reject preview snippets < 60s
    if (durationSec > 0 && durationSec < 60) {
      throw new Error("JioSaavn candidate duration < 60s, preview rejected");
    }

    const downloadUrls = candidate.download_url || candidate.downloadUrl;
    let chosenUrl = "";

    // Prioritize 160kbps or 96kbps AAC for instantaneous playback (<300ms)
    if (Array.isArray(downloadUrls) && downloadUrls.length > 0) {
      const quality160 = downloadUrls.find(
        (d: { quality?: string; link?: string; url?: string }) =>
          d.quality === "160kbps" || (d.link || d.url || "").includes("_160.")
      );
      const quality96 = downloadUrls.find(
        (d: { quality?: string; link?: string; url?: string }) =>
          d.quality === "96kbps" || (d.link || d.url || "").includes("_96.")
      );
      const best = quality160 || quality96 || downloadUrls[downloadUrls.length - 1];
      chosenUrl = best?.link || best?.url || downloadUrls[0]?.link || downloadUrls[0]?.url || "";
    } else if (typeof downloadUrls === "string") {
      chosenUrl = downloadUrls;
    }

    if (!chosenUrl) throw new Error("No downloadUrl");

    const { streamUrl, proxyUrl } = resolvePlaybackUrl(chosenUrl);

    return {
      streamUrl,
      proxyUrl,
      duration: (durationSec > 0 ? durationSec : targetDurationSec || 180) * 1000,
      source: "jiosaavn" as const,
      isFallback: false as const,
    };
  });

  return Promise.any(clusterPromises);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawTitle = searchParams.get("title")?.trim() || "";
  const rawArtist = searchParams.get("artist")?.trim() || "";
  const requestedDurationMs = Number(searchParams.get("duration") || 0);
  const targetDurationSec = requestedDurationMs > 0 ? Math.round(requestedDurationMs / 1000) : 0;

  if (!rawTitle && !rawArtist) {
    return NextResponse.json({ error: "Missing title and artist" }, { status: 400 });
  }

  const { cleanTitle, cleanArtist } = cleanTrackQuery(rawTitle, rawArtist);
  const cacheKey = `${cleanArtist.toLowerCase()}-${cleanTitle.toLowerCase()}`;

  // Instant response from 30-minute server memory cache
  const cached = streamCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      ...cached.result,
      cached: true,
    });
  }

  // 2400ms parallel race between verified Full-Track providers (JioSaavn & YouTube Music)
  const raceAbortController = new AbortController();
  const raceTimeout = setTimeout(() => raceAbortController.abort(), 2400);

  try {
    const fullTrackRace = [
      fetchFromJioSaavn(cleanTitle, cleanArtist, targetDurationSec, raceAbortController.signal),
      fetchFromYouTube(cleanTitle, cleanArtist, targetDurationSec, raceAbortController.signal),
    ];

    const winner = await Promise.any(fullTrackRace);
    clearTimeout(raceTimeout);

    // Save to server cache
    streamCache.set(cacheKey, { result: winner, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      ...winner,
    });
  } catch {
    clearTimeout(raceTimeout);

    // Strict Full-Track Only: No 30s previews returned under any circumstances
    return NextResponse.json(
      {
        success: false,
        error: "No full-track audio stream available for this track (strict full-track only)",
        isFallback: false,
      },
      { status: 404 }
    );
  }
}
