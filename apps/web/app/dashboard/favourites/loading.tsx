import BookmarksGridSkeleton from "@/components/dashboard/bookmarks/BookmarksGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function FavouritesLoading() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <BookmarksGridSkeleton count={8} />
    </div>
  );
}
