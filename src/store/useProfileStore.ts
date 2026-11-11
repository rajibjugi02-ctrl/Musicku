import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProfileState {
  name: string;
  username: string;
  bio: string;
  avatarUrl: string;

  updateProfile: (data: Partial<{ name: string; username: string; bio: string; avatarUrl: string }>) => void;
  syncWithSession: (sessionUser: { name?: string | null; email?: string | null; image?: string | null }) => void;
}

const DEFAULT_AVATAR =
  "https://cdn-images.dzcdn.net/images/artist/324c50c04a5a944117cd3daa0963fc63/1000x1000-000000-80-0-0.jpg";

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      name: "Rajib Zahir",
      username: "rajibzahir",
      bio: "Curating nocturnal soundscapes, live synced lyrics & liquid audio vibes. 🎧✨",
      avatarUrl: DEFAULT_AVATAR,

      updateProfile: (data) => {
        set((state) => {
          let cleanedUsername = state.username;
          if (data.username !== undefined) {
            // Clean username: remove leading '@', spaces, and special symbols
            cleanedUsername = data.username.replace(/^@+/, "").replace(/[^a-zA-Z0-9._]/g, "").toLowerCase();
          }

          let cleanedBio = state.bio;
          if (data.bio !== undefined) {
            // Max 160 characters
            cleanedBio = data.bio.slice(0, 160);
          }

          return {
            name: data.name !== undefined ? data.name.trim() : state.name,
            username: cleanedUsername,
            bio: cleanedBio,
            avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : state.avatarUrl,
          };
        });
      },

      syncWithSession: (sessionUser) => {
        const current = get();
        // If current profile is still default, populate from authenticated session
        if (sessionUser.name && current.name === "Rajib Zahir") {
          const derivedUsername = sessionUser.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          set({
            name: sessionUser.name,
            username: derivedUsername || current.username,
            avatarUrl: sessionUser.image || current.avatarUrl,
          });
        }
      },
    }),
    {
      name: "musicku-profile",
    }
  )
);

