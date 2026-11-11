import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getFallbackUserByEmail, saveFallbackUser } from "@/lib/user-store";
import type { NextAuthConfig } from "next-auth";
import type { Adapter } from "next-auth/adapters";

// Resilient Adapter wrapping Prisma with Fail-Safe User Store fallback
const baseAdapter = PrismaAdapter(prisma);
const resilientAdapter: Adapter = {
  ...baseAdapter,
  async getUserByAccount(account) {
    try {
      return await baseAdapter.getUserByAccount!(account);
    } catch (err) {
      console.warn("[AuthAdapter] Prisma getUserByAccount warning:", err);
      return null;
    }
  },
  async getUserByEmail(email) {
    try {
      const u = await baseAdapter.getUserByEmail!(email);
      if (u) return u;
    } catch (err) {
      console.warn("[AuthAdapter] Prisma getUserByEmail warning:", err);
    }
    const fallback = await getFallbackUserByEmail(email);
    if (fallback) {
      return {
        id: fallback.id,
        email: fallback.email,
        name: fallback.name,
        image: fallback.image || null,
        emailVerified: null,
      };
    }
    return null;
  },
  async createUser(user) {
    try {
      // Ensure newly created accounts start with no profile picture (kosongan tanpa foto)
      return await baseAdapter.createUser!({
        ...user,
        image: null,
      });
    } catch (err) {
      console.warn("[AuthAdapter] Prisma createUser warning, falling back to local store:", err);
      const fallback = await saveFallbackUser({
        name: user.name || "Musicku User",
        email: user.email,
        password: "",
        image: null,
      });
      return {
        ...user,
        image: null,
        id: fallback.id,
        emailVerified: null,
      };
    }
  },
  async linkAccount(account) {
    try {
      const res = await baseAdapter.linkAccount!(account);
      return res ?? undefined;
    } catch (err) {
      console.warn("[AuthAdapter] Prisma linkAccount bypassed gracefully:", err);
      return undefined;
    }
  },
};

export const config: NextAuthConfig = {
  ...authConfig,
  adapter: resilientAdapter,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const normalizedEmail = (credentials.email as string).toLowerCase().trim();
        const rawPassword = credentials.password as string;

        let user: {
          id: string;
          email: string;
          name: string | null;
          image: string | null;
          password?: string | null;
        } | null = null;

        // 1. Check PostgreSQL Prisma store
        try {
          user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });
        } catch (dbErr) {
          console.warn("[Auth] Prisma user lookup failed, falling back to local store:", dbErr);
        }

        // 2. If not found in Prisma (or DB temporarily disconnected), check Fail-Safe User Store
        if (!user) {
          const fallback = await getFallbackUserByEmail(normalizedEmail);
          if (fallback) {
            user = {
              id: fallback.id,
              email: fallback.email,
              name: fallback.name,
              image: fallback.image || null,
              password: fallback.password,
            };
          }
        }

        if (!user?.password) return null;

        // Validate password hash
        const isValid = await bcrypt.compare(rawPassword, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name || "Musicku User",
          image: user.image || null,
        };
      },
    }),
    ...authConfig.providers,
  ],
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
