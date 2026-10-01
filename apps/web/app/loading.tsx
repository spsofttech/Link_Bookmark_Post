import KarakeepLogo from "@/components/KarakeepIcon";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
      <KarakeepLogo height={48} />
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading Karakeep...</span>
      </div>
      <div className="h-1 w-36 overflow-hidden rounded-full bg-muted">
        <div className="h-full animate-[progress_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
    </div>
  );
}
