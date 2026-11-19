import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Liquid Titanium Specular Ambient Glow (Monochrome, no purple/pink slop) */}
      <div className="absolute -top-[10%] left-[20%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full opacity-20 blur-[140px] bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-[10%] right-[20%] w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] rounded-full opacity-15 blur-[140px] bg-zinc-500/10 pointer-events-none" />

      <Suspense fallback={<div className="w-full max-w-sm h-96 glass-panel rounded-[32px] animate-pulse" />}>
        <AuthForm initialMode="register" />
      </Suspense>
    </div>
  );
}
