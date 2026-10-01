import { Skeleton } from "@/components/ui/skeleton";

export default function HighlightsLoading() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-7 w-28" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-3/4" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="w-18 h-5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
