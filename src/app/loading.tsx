export default function Loading() {
  return (
    <div className="h-screen w-screen p-2.5 sm:p-3.5 gap-2.5 sm:gap-3.5 flex flex-col overflow-hidden relative select-none bg-[#F2F4F8] dark:bg-[#070709]">
      <div className="flex flex-1 min-h-0 gap-2.5 sm:gap-3.5">
        {/* Desktop Left Sidebar Skeleton */}
        <aside className="hidden md:flex flex-col w-60 glass-panel rounded-[28px] p-4 gap-4 flex-shrink-0 animate-pulse">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-2xl bg-black/10 dark:bg-white/10" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-4 w-20 rounded-full bg-black/10 dark:bg-white/10" />
              <div className="h-2.5 w-14 rounded-full bg-black/5 dark:bg-white/5" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 rounded-2xl bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        </aside>

        {/* Center Main Viewport Skeleton */}
        <main className="flex-1 glass-panel rounded-[28px] p-6 sm:p-8 flex flex-col gap-6 overflow-hidden animate-pulse">
          {/* Hero Banner Skeleton */}
          <div className="h-32 w-full rounded-[26px] bg-black/5 dark:bg-white/5 p-6 flex flex-col justify-center gap-3">
            <div className="h-5 w-36 rounded-full bg-black/10 dark:bg-white/10" />
            <div className="h-7 w-64 rounded-full bg-black/15 dark:bg-white/15" />
          </div>

          {/* Horizontal Track Row Skeleton */}
          <div className="flex flex-col gap-3">
            <div className="h-4 w-40 rounded-full bg-black/10 dark:bg-white/10" />
            <div className="flex gap-4 overflow-hidden pt-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-44 h-56 rounded-[22px] bg-black/5 dark:bg-white/5 flex-shrink-0"
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Floating Bar Skeleton */}
      <div className="h-16 w-full rounded-[24px] bg-black/5 dark:bg-white/5 flex-shrink-0 animate-pulse" />
    </div>
  );
}

