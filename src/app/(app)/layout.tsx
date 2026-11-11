import AppShell from "@/components/layout/AppShell";
import { SpotifyPlaybackProvider } from "@/components/player/SpotifyPlaybackProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SpotifyPlaybackProvider>
      <AppShell>{children}</AppShell>
    </SpotifyPlaybackProvider>
  );
}
