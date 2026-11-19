import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Spotify from "next-auth/providers/spotify";

// Lightweight standard Spotify scope to guarantee frictionless OAuth without dev-quota restrictions
const SPOTIFY_SCOPES = "user-read-email user-read-private";

const googleClientId = (
  process.env.GOOGLE_CLIENT_ID ||
  process.env.AUTH_GOOGLE_ID ||
  ""
).trim();

const googleClientSecret = (
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.AUTH_GOOGLE_SECRET ||
  ""
).trim();

const spotifyClientId = (
  process.env.SPOTIFY_CLIENT_ID ||
  process.env.AUTH_SPOTIFY_ID ||
  ""
).trim();

const spotifyClientSecret = (
  process.env.SPOTIFY_CLIENT_SECRET ||
  process.env.AUTH_SPOTIFY_SECRET ||
  ""
).trim();

export const authConfig: NextAuthConfig = {
  secret: (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "musicku_super_secure_random_production_secret_key_2026_x89q"
  ).trim(),
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
    Spotify({
      clientId: spotifyClientId,
      clientSecret: spotifyClientSecret,
      allowDangerousEmailAccountLinking: true,
      authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(SPOTIFY_SCOPES)}`,
    }),
  ],
  callbacks: {
    redirect({ url, baseUrl }) {
      // Prevents blank screens and ensures redirects always return safely to app home
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // Fall back to baseUrl
      }
      return baseUrl;
    },
    jwt({ token, account, user }) {
      if (account?.provider === "spotify") {
        token.spotifyAccessToken = account.access_token;
        token.spotifyRefreshToken = account.refresh_token;
        token.spotifyTokenExpiry = account.expires_at;
      }
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      session.spotifyAccessToken = token?.spotifyAccessToken as string | undefined;
      return session;
    },
  },
};
