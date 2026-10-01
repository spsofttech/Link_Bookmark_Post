import type { ZBookmark } from "@karakeep/shared/types/bookmarks";

import { BookmarkLayoutAdaptingCard } from "./BookmarkLayoutAdaptingCard";
import { renderTextWithLinks } from "./NotePreview";

export default function UnknownCard({
  bookmark,
  className,
  bookmarkIndex,
}: {
  bookmark: ZBookmark;
  className?: string;
  bookmarkIndex?: number;
}) {
  const displayContent =
    bookmark.summary || bookmark.note || bookmark.title || "Note";
  return (
    <BookmarkLayoutAdaptingCard
      title={bookmark.title}
      bookmark={bookmark}
      className={className}
      bookmarkIndex={bookmarkIndex}
      wrapTags={false}
      image={(_layout) => (
        <div className="flex size-full flex-1 flex-col justify-start overflow-hidden bg-card p-4 text-left">
          <p className="line-clamp-6 text-sm text-foreground/90">
            {renderTextWithLinks(displayContent)}
          </p>
        </div>
      )}
    />
  );
}
