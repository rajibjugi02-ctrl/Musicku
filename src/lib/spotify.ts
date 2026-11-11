import type { SpotifyTrack, SpotifyArtist, SpotifyAlbum } from "@/types/music";

const BASE = "https://api.spotify.com/v1";

async function spotifyFetch<T>(
  path: string,
  accessToken: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify API ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

// Server-side client credentials token (no user scope, for catalog browsing)
let _clientToken: { token: string; expiresAt: number } | null = null;

export async function getClientToken(): Promise<string> {
  if (_clientToken && Date.now() < _clientToken.expiresAt) {
    return _clientToken.token;
  }

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    next: { revalidate: 3500 },
  });

  const data = (await res.json()) as { access_token: string; expires_in: number };
  _clientToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
  };
  return _clientToken.token;
}

export async function searchTracks(
  query: string,
  token: string,
  limit = 20
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({ q: query, type: "track", limit: String(limit) });
  const data = await spotifyFetch<{ tracks: { items: SpotifyTrack[] } }>(
    `/search?${params}`,
    token
  );
  return data.tracks.items;
}

export async function searchArtists(
  query: string,
  token: string,
  limit = 10
): Promise<SpotifyArtist[]> {
  const params = new URLSearchParams({ q: query, type: "artist", limit: String(limit) });
  const data = await spotifyFetch<{ artists: { items: SpotifyArtist[] } }>(
    `/search?${params}`,
    token
  );
  return data.artists.items;
}

export async function getPopularTracks(token: string): Promise<SpotifyTrack[]> {
  // Fetch a mix of popular playlists' tracks via featured playlists
  const data = await spotifyFetch<{ playlists: { items: { id: string }[] } }>(
    "/browse/featured-playlists?limit=5",
    token
  );
  const playlistId = data.playlists.items[Math.floor(Math.random() * data.playlists.items.length)]?.id;
  if (!playlistId) return [];

  const playlist = await spotifyFetch<{ items: { track: SpotifyTrack }[] }>(
    `/playlists/${playlistId}/tracks?limit=20`,
    token
  );
  return playlist.items.map((i) => i.track).filter(Boolean);
}

export async function getRecommendations(
  seedTrackIds: string[],
  seedArtistIds: string[],
  token: string,
  limit = 10
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    seed_tracks: seedTrackIds.slice(0, 2).join(","),
    seed_artists: seedArtistIds.slice(0, 3).join(","),
    limit: String(limit),
  });
  const data = await spotifyFetch<{ tracks: SpotifyTrack[] }>(
    `/recommendations?${params}`,
    token
  );
  return data.tracks;
}

export async function getArtist(id: string, token: string): Promise<SpotifyArtist> {
  return spotifyFetch<SpotifyArtist>(`/artists/${id}`, token);
}

export async function getArtistTopTracks(
  id: string,
  token: string
): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch<{ tracks: SpotifyTrack[] }>(
    `/artists/${id}/top-tracks?market=US`,
    token
  );
  return data.tracks;
}

export async function getArtistAlbums(
  id: string,
  token: string
): Promise<SpotifyAlbum[]> {
  const data = await spotifyFetch<{ items: SpotifyAlbum[] }>(
    `/artists/${id}/albums?limit=10&include_groups=album,single`,
    token
  );
  return data.items;
}

export async function getRandomArtists(token: string): Promise<SpotifyArtist[]> {
  const queries = ["pop", "rock", "hip-hop", "indie", "electronic"];
  const q = queries[Math.floor(Math.random() * queries.length)];
  return searchArtists(q, token, 10);
}

export async function getTrack(id: string, token: string): Promise<SpotifyTrack> {
  return spotifyFetch<SpotifyTrack>(`/tracks/${id}`, token);
}

