import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Musicku — Liquid Audio Streaming",
  description: "Apple iOS 26 Liquid Glassmorphism Music Player with synced live lyrics",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/icon.jpg" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-icon.jpg" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="dark"
      style={{ colorScheme: "dark", backgroundColor: "#070709" }}
      suppressHydrationWarning
    >
      <head>
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== "undefined" && "serviceWorker" in navigator) {
                window.addEventListener("load", function() {
                  navigator.serviceWorker.register("/sw.js").catch(function(err) {});
                });
              }
            `,
          }}
        />
        {/* Anti-FOUC Blocking Theme Script (Eliminates White Flash on Refresh) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem("musicku-ui");
                  var theme = "dark";
                  if (raw) {
                    var parsed = JSON.parse(raw);
                    if (parsed && parsed.state && parsed.state.theme) {
                      theme = parsed.state.theme;
                    }
                  }
                  if (theme === "light") {
                    document.documentElement.classList.remove("dark");
                    document.documentElement.style.colorScheme = "light";
                    document.documentElement.style.backgroundColor = "#F2F4F8";
                  } else {
                    document.documentElement.classList.add("dark");
                    document.documentElement.style.colorScheme = "dark";
                    document.documentElement.style.backgroundColor = "#070709";
                  }
                } catch (e) {
                  document.documentElement.classList.add("dark");
                  document.documentElement.style.colorScheme = "dark";
                  document.documentElement.style.backgroundColor = "#070709";
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#070709] text-zinc-100`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
