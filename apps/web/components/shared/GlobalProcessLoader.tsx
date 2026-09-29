"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GlobalProcessLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Monitor route changes
  useEffect(() => {
    setNavigating(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(70), 150);
    const timer2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setNavigating(false);
        setProgress(0);
      }, 200);
    }, 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname, searchParams]);

  const activeProcess = isFetching > 0 || isMutating > 0 || navigating;

  if (!activeProcess && progress === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex flex-col">
      {/* Top Animated Progress Bar */}
      <div className="h-1 w-full overflow-hidden bg-transparent">
        <div
          className={cn(
            "h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-sm shadow-blue-500/50 transition-all duration-300 ease-out",
            activeProcess && progress === 0 && "w-1/3 animate-pulse",
          )}
          style={{
            width:
              activeProcess && progress === 0 ? "40%" : `${progress || 90}%`,
          }}
        />
      </div>

      {/* Top Right Floating Activity Spinner */}
      {(isFetching > 0 || isMutating > 0) && (
        <div className="absolute right-4 top-3 flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-lg backdrop-blur duration-200 animate-in fade-in slide-in-from-top-2">
          <Loader2 className="size-3.5 animate-spin text-primary" />
          <span>
            {isMutating > 0 ? "Saving changes..." : "Loading data..."}
          </span>
        </div>
      )}
    </div>
  );
}
