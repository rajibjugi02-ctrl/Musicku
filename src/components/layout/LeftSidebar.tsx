"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Home, Search, Library, Heart, Settings,
  Moon, Sun, LogOut, User,
} from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useProfileStore } from "@/store/useProfileStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Discover", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/liked-artists", label: "Liked Artists", icon: Heart },
  { href: "/profile", label: "Profile", icon: User },
];

export default function LeftSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useUIStore();
  const { name, username, avatarUrl, syncWithSession } = useProfileStore();

  // Sync profile store if logged in with NextAuth/Google
  useEffect(() => {
    if (session?.user) {
      syncWithSession(session.user);
    }
  }, [session?.user, syncWithSession]);

  return (
    <div className="flex flex-col h-full p-4 gap-2">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-2 mb-3">
        <div className="w-9 h-9 rounded-2xl overflow-hidden border border-black/10 dark:border-white/20 flex items-center justify-center shadow-lg shadow-cyan-500/10 bg-black">
          <img src="/logo.png" alt="Musicku" className="w-full h-full object-cover" />
        </div>
        <div>
          <span className="font-semibold text-sm tracking-wider text-zinc-900 dark:text-white">Musicku</span>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-widest uppercase">Liquid Glass</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col gap-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}>
              <motion.div
                whileTap={{ scale: 0.96 }}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer",
                  active
                    ? "glass-pill text-zinc-950 dark:text-white font-bold shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-indigo-600 dark:text-white stroke-[2.5]" : "text-zinc-500 dark:text-zinc-400")} />
                <span>{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Preferences & Profile */}
      <div className="mt-auto flex flex-col gap-1.5 pt-3 border-t border-black/[0.08] dark:border-white/[0.08]">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all w-full cursor-pointer"
        >
          <span className="flex items-center gap-3">
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </span>
          <span className="text-[10px] font-mono uppercase text-zinc-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
            {theme}
          </span>
        </button>

        {/* Settings Link */}
        <Link href="/settings">
          <motion.div
            whileTap={{ scale: 0.96 }}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer",
              pathname === "/settings"
                ? "glass-pill text-zinc-950 dark:text-white font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            )}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </motion.div>
        </Link>

        {/* User Profile Card linked to /profile */}
        <div className="glass-card rounded-2xl p-2.5 mt-1 flex items-center justify-between gap-2.5 group">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
          >
            {avatarUrl &&
            !avatarUrl.includes("324c50c04a5a944117cd3daa0963fc63") &&
            !avatarUrl.includes("photo-1534528741775") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                className="w-8 h-8 rounded-full object-cover border border-black/10 dark:border-white/20 flex-shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center border border-indigo-500/30 flex-shrink-0">
                {name[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate leading-tight group-hover:underline">
                {name}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-mono">
                @{username}
              </p>
            </div>
          </Link>

          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="text-zinc-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
