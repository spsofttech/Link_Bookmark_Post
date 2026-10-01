import BookmarksGridSkeleton from "@/components/dashboard/bookmarks/BookmarksGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function TagsLoading() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-7 w-24" />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 20 }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-8 rounded-full ${["w-16", "w-20", "w-24", "w-14", "w-28"][i % 5]}`}
          />
        ))}
      </div>
      <BookmarksGridSkeleton count={8} />
    </div>
  );
}
