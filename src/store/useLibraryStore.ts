import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerTrack, SpotifyArtist } from "@/types/music";

export interface CustomLibrary {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  tracks: PlayerTrack[];
  createdAt: number;
}

interface LibraryState {
  likedTracks: PlayerTrack[];
  likedArtists: SpotifyArtist[];
  customLibraries: CustomLibrary[];

  // Track Favorites
  toggleLikeTrack: (track: PlayerTrack) => void;
  isTrackLiked: (trackId: string) => boolean;

  // Artist Favorites
  toggleLikeArtist: (artist: SpotifyArtist) => void;
  isArtistLiked: (artistId: string) => boolean;
  updateArtistImage: (artistId: string, newImageUrl: string) => void;
  healArtistImages: () => Promise<void>;

  // Custom Libraries / Playlists
  createLibrary: (name: string, description?: string, coverUrl?: string) => string;
  deleteLibrary: (libraryId: string) => void;
  addTrackToLibrary: (libraryId: string, track: PlayerTrack) => void;
  removeTrackFromLibrary: (libraryId: string, trackId: string) => void;
  isTrackInLibrary: (libraryId: string, trackId: string) => boolean;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      likedTracks: [],
      likedArtists: [],
      customLibraries: [
        {
          id: "lib-favorites",
          name: "My Chill Vibes",
          description: "Relaxed beats and favorites for late-night focus",
          coverUrl: "https://cdn-images.dzcdn.net/images/cover/2c45e43a9dc745330386cfc5feee0642/1000x1000-000000-80-0-0.jpg",
          tracks: [],
          createdAt: Date.now() - 86400000,
        },
      ],

      toggleLikeTrack(track) {
        set((state) => {
          const exists = state.likedTracks.some((t) => t.id === track.id);
          const updated = exists
            ? state.likedTracks.filter((t) => t.id !== track.id)
            : [track, ...state.likedTracks];
          return { likedTracks: updated };
        });
      },

      isTrackLiked(trackId) {
        return get().likedTracks.some((t) => t.id === trackId);
      },

      toggleLikeArtist(artist) {
        set((state) => {
          const exists = state.likedArtists.some((a) => a.id === artist.id);
          const updated = exists
            ? state.likedArtists.filter((a) => a.id !== artist.id)
            : [artist, ...state.likedArtists];
          return { likedArtists: updated };
        });
      },

      isArtistLiked(artistId) {
        return get().likedArtists.some((a) => a.id === artistId);
      },

      updateArtistImage(artistId, newImageUrl) {
        set((state) => ({
          likedArtists: state.likedArtists.map((a) =>
            a.id === artistId
              ? {
                  ...a,
                  images: [{ url: newImageUrl, width: 1000, height: 1000 }],
                }
              : a
          ),
        }));
      },

      async healArtistImages() {
        const { likedArtists, updateArtistImage } = get();
        const staleArtists = likedArtists.filter((a) => {
          const img = a.images?.[0]?.url || "";
          return !img || img.includes("unsplash.com") || img.includes("images.unsplash");
        });

        if (staleArtists.length === 0) return;

        await Promise.all(
          staleArtists.map(async (a) => {
            try {
              const res = await fetch(`/api/music?action=artist-picture&name=${encodeURIComponent(a.name)}`);
              if (res.ok) {
                const data = await res.json();
                if (data.pictureUrl) {
                  updateArtistImage(a.id, data.pictureUrl);
                }
              }
            } catch {}
          })
        );
      },

      createLibrary(name, description = "", coverUrl) {
        const id = `lib-${Date.now()}`;
        const newLib: CustomLibrary = {
          id,
          name: name.trim() || "Untitled Library",
          description: description.trim(),
          coverUrl: coverUrl || "https://cdn-images.dzcdn.net/images/cover/2c45e43a9dc745330386cfc5feee0642/1000x1000-000000-80-0-0.jpg",
          tracks: [],
          createdAt: Date.now(),
        };

        set((state) => ({
          customLibraries: [newLib, ...state.customLibraries],
        }));

        return id;
      },

      deleteLibrary(libraryId) {
        set((state) => ({
          customLibraries: state.customLibraries.filter((l) => l.id !== libraryId),
        }));
      },

      addTrackToLibrary(libraryId, track) {
        set((state) => ({
          customLibraries: state.customLibraries.map((lib) => {
            if (lib.id !== libraryId) return lib;
            if (lib.tracks.some((t) => t.id === track.id)) return lib;
            return {
              ...lib,
              tracks: [track, ...lib.tracks],
              coverUrl: lib.tracks.length === 0 ? track.albumArt : lib.coverUrl,
            };
          }),
        }));
      },

      removeTrackFromLibrary(libraryId, trackId) {
        set((state) => ({
          customLibraries: state.customLibraries.map((lib) => {
            if (lib.id !== libraryId) return lib;
            return {
              ...lib,
              tracks: lib.tracks.filter((t) => t.id !== trackId),
            };
          }),
        }));
      },

      isTrackInLibrary(libraryId, trackId) {
        const lib = get().customLibraries.find((l) => l.id === libraryId);
        return lib ? lib.tracks.some((t) => t.id === trackId) : false;
      },
    }),
    {
      name: "musicku-library-storage",
    }
  )
);
