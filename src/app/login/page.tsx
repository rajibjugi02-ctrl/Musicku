import AuthForm from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Specular ambient background glow orbs */}
      <div className="absolute -top-[10%] left-[20%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full opacity-25 blur-[120px] bg-gradient-to-tr from-indigo-500/40 to-purple-500/20 pointer-events-none" />
      <div className="absolute -bottom-[10%] right-[20%] w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] rounded-full opacity-20 blur-[120px] bg-gradient-to-tr from-cyan-500/30 to-pink-500/20 pointer-events-none" />

      <AuthForm initialMode="signin" />
    </div>
  );
}
