import KarakeepLogo from "@/components/KarakeepIcon";
import { Loader2, Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
      <KarakeepLogo height={48} />
      <div className="flex items-center gap-2 text-foreground">
        <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <span className="flex items-center gap-1.5 text-base font-bold tracking-tight">
          <Sparkles className="size-4 text-primary" />
          Loading Save Content...
        </span>
      </div>
      <div className="h-1.5 w-44 overflow-hidden rounded-full bg-muted">
        <div className="h-full animate-[progress_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
    </div>
  );
}
