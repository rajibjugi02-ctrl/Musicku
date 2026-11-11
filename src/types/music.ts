export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  preview_url: string | null;
  explicit: boolean;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; width: number; height: number }[];
    release_date: string;
  };
  external_urls: { spotify: string };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
  genres: string[];
  followers: { total: number };
  popularity: number;
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
  release_date: string;
  total_tracks: number;
  artists: { id: string; name: string }[];
  external_urls: { spotify: string };
}

export interface LrcLine {
  time: number; // seconds
  text: string;
}

export interface PlayerTrack {
  id: string;
  uri: string;
  name: string;
  artistName: string;
  albumName: string;
  albumArt: string;
  duration: number; // ms
  previewUrl: string | null;
  explicit: boolean;
}
