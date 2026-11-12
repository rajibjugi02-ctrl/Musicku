"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { useProfileStore } from "@/store/useProfileStore";

interface AuthFormProps {
  initialMode?: "signin" | "register";
}

export default function AuthForm({ initialMode = "signin" }: AuthFormProps) {
  const [mode, setMode] = useState<"signin" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "spotify" | null>(null);

  const switchMode = (newMode: "signin" | "register") => {
    setError("");
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    if (mode === "signin") {
      try {
        const res = await signIn("credentials", {
          email: cleanEmail,
          password,
          redirect: false,
        });

        if (res?.error) {
          setError("Invalid email address or password. Please try again.");
          setLoading(false);
        } else {
          // Hard redirect to propagate session cookies cleanly to middleware
          window.location.href = "/";
        }
      } catch {
        setError("An unexpected error occurred during sign in.");
        setLoading(false);
      }
    } else {
      // Register Mode
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: cleanEmail,
            password,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setError(data?.error || "Registration failed. Please try again.");
          setLoading(false);
          return;
        }

        // Auto sign-in immediately upon successful account creation
        const signInRes = await signIn("credentials", {
          email: cleanEmail,
          password,
          redirect: false,
        });

        if (signInRes?.error) {
          // Fallback if auto-login encountered an error
          setError("Account created! Please sign in with your password.");
          setMode("signin");
          setLoading(false);
          return;
        }

        // Sync display name and username into profile store
        const derivedUsername = (name || cleanEmail.split("@")[0] || "user")
          .toLowerCase()
          .replace(/[^a-z0-9._]/g, "")
          .slice(0, 20);

        useProfileStore.getState().updateProfile({
          name: name.trim() || "Musicku User",
          username: derivedUsername || "musicku_user",
          bio: "",
          avatarUrl: "",
        });

        window.location.href = "/";
      } catch {
        setError("Unable to connect to registration server. Please try again.");
        setLoading(false);
      }
    }
  };

  const handleOAuth = (provider: "google" | "spotify") => {
    setOauthLoading(provider);
    signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="w-full max-w-sm relative z-10 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2.5 mb-7">
        <div className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg border border-white/20 bg-black shadow-cyan-500/10">
          <img src="/logo.png" alt="Musicku" className="w-full h-full object-cover" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white">Musicku</span>
          <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">Liquid Audio</p>
        </div>
      </div>

      {/* Floating iOS Liquid Glass Card */}
      <div className="glass-panel rounded-[32px] p-7 sm:p-8 shadow-2xl border border-white/10 backdrop-blur-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <h1 className="text-xl font-bold text-white mb-1 tracking-tight">
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-xs text-zinc-400 mb-6">
              {mode === "signin"
                ? "Sign in to continue your music journey"
                : "Start streaming with real-time synced lyrics"}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {mode === "register" && (
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full h-11 pl-10 pr-3 rounded-2xl glass-card text-white placeholder:text-zinc-500 text-xs focus:outline-none focus:border-white/30 transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full h-11 pl-10 pr-3 rounded-2xl glass-card text-white placeholder:text-zinc-500 text-xs focus:outline-none focus:border-white/30 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signin" ? "Password" : "Password (min. 6 characters)"}
                  required
                  minLength={mode === "register" ? 6 : undefined}
                  className="w-full h-11 pl-10 pr-10 rounded-2xl glass-card text-white placeholder:text-zinc-500 text-xs focus:outline-none focus:border-white/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center leading-relaxed">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || !!oauthLoading}
                whileTap={{ scale: 0.98 }}
                className="h-11 rounded-2xl bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-100 transition-all shadow-lg shadow-white/10 disabled:opacity-50 flex items-center justify-center gap-2 mt-1.5 cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />}
                <span>
                  {loading
                    ? mode === "signin"
                      ? "Signing in..."
                      : "Creating Account..."
                    : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
                </span>
              </motion.button>
            </form>

            {/* OR Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Social OAuth Buttons */}
            <div className="flex flex-col gap-2.5">
              {/* Google OAuth Button */}
              <motion.button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={loading || !!oauthLoading}
                whileTap={{ scale: 0.98 }}
                className="h-11 w-full rounded-2xl glass-card border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2.5 text-xs font-medium text-white/90 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {oauthLoading === "google" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </motion.button>

              {/* Spotify OAuth Button */}
              <motion.button
                type="button"
                onClick={() => handleOAuth("spotify")}
                disabled={loading || !!oauthLoading}
                whileTap={{ scale: 0.98 }}
                className="h-11 w-full rounded-2xl glass-card border border-white/10 hover:border-emerald-500/30 bg-white/[0.03] hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2.5 text-xs font-medium text-white/90 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {oauthLoading === "spotify" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0 text-[#1DB954]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.218.358-.684.47-1.042.252-2.854-1.744-6.446-2.14-10.68-1.173-.41.093-.815-.164-.908-.574-.093-.41.164-.815.574-.908 4.636-1.059 8.608-.614 11.804 1.341.358.218.47.684.252 1.062zm1.467-3.26c-.274.446-.86.588-1.306.314-3.268-2.01-8.248-2.593-12.112-1.42-.497.151-1.026-.134-1.177-.63-.151-.497.134-1.026.63-1.177 4.417-1.34 9.907-.69 13.651 1.607.446.274.588.86.314 1.306zm.126-3.41c-3.918-2.327-10.377-2.542-14.126-1.403-.6.182-1.242-.164-1.424-.764-.182-.6.164-1.242.764-1.424 4.306-1.307 11.436-1.057 15.939 1.616.538.319.715 1.018.396 1.556-.319.538-1.018.715-1.549.419z" />
                  </svg>
                )}
                <span>Continue with Spotify</span>
              </motion.button>
            </div>

            {/* Smooth Mode Switcher */}
            <p className="text-center text-xs text-zinc-400 mt-6">
              {mode === "signin" ? (
                <>
                  No account yet?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="text-white font-medium hover:underline transition-colors cursor-pointer"
                  >
                    Create One
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="text-white font-medium hover:underline transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

