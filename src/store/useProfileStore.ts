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

const DEFAULT_AVATAR = "";

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      name: "",
      username: "",
      bio: "",
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
        if (!sessionUser) return;
        const current = get();
        const fallbackName = sessionUser.name || (sessionUser.email ? sessionUser.email.split("@")[0] : "Musicku User");
        const derivedUsername = (sessionUser.name || sessionUser.email || "user")
          .toLowerCase()
          .replace(/[^a-z0-9._]/g, "")
          .slice(0, 20);

        // Sanitize any previous legacy default photo from local storage
        const isLegacyAvatar =
          current.avatarUrl &&
          (current.avatarUrl.includes("dzcdn.net") || current.avatarUrl.includes("unsplash.com"));

        set({
          name: current.name && current.name !== "Rajib Zahir" ? current.name : fallbackName,
          username: current.username && current.username !== "rajibzahir" ? current.username : (derivedUsername || "user"),
          bio: current.bio && !current.bio.includes("Curating nocturnal soundscapes") ? current.bio : "",
          avatarUrl: isLegacyAvatar
            ? (sessionUser.image || "")
            : (current.avatarUrl || sessionUser.image || ""),
        });
      },
    }),
    {
      name: "musicku-profile",
    }
  )
);

