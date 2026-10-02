"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GlobalProcessLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMutating = useIsMutating();

  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Global click listener to trigger loader immediately on clicking any menu button or internal link
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;

      if (anchor && anchor.href) {
        try {
          const url = new URL(anchor.href, window.location.origin);
          const isInternal = url.origin === window.location.origin;
          const isDifferentPath =
            url.pathname !== window.location.pathname ||
            url.search !== window.location.search;

          if (
            isInternal &&
            isDifferentPath &&
            !anchor.target &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.shiftKey
          ) {
            setNavigating(true);
            setProgress(35);
          }
        } catch {
          // Ignore invalid URLs
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, {
        capture: true,
      });
    };
  }, []);

  // When route changes complete, fill progress to 100% and hide loader
  useEffect(() => {
    if (navigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setNavigating(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  const activeProcess = isMutating > 0 || navigating;

  if (!activeProcess && progress === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex flex-col">
      {/* Top Animated Progress Bar */}
      <div className="h-1 w-full overflow-hidden bg-transparent">
        <div
          className={cn(
            "h-full bg-primary shadow-sm shadow-primary/40 transition-all duration-300 ease-out",
            navigating && "animate-pulse",
          )}
          style={{
            width: progress > 0 ? `${progress}%` : activeProcess ? "40%" : "0%",
          }}
        />
      </div>

      {/* Top Right Floating Activity Spinner */}
      {(isMutating > 0 || navigating) && (
        <div className="pointer-events-auto absolute right-4 top-3 flex items-center gap-2.5 rounded-full border border-border/80 bg-popover/90 px-3.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg backdrop-blur-md duration-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="size-3.5 animate-spin" />
          </div>
          <span className="font-semibold text-foreground">Save Content</span>
          <span className="text-muted-foreground">
            {navigating
              ? "Navigating..."
              : isMutating > 0
                ? "Saving changes..."
                : "Loading data..."}
          </span>
        </div>
      )}
    </div>
  );
}
