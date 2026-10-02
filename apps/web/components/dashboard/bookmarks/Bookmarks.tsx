import { Separator } from "@/components/ui/separator";
import { api, createGuestCaller } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";

import type { ZGetBookmarksRequest } from "@karakeep/shared/types/bookmarks";

import UpdatableBookmarksGrid from "./UpdatableBookmarksGrid";

export default async function Bookmarks({
  query,
  header,
  showDivider,
  showEditorCard = false,
}: {
  query: Omit<ZGetBookmarksRequest, "sortOrder" | "includeContent">; // Sort order is handled by the store
  header?: React.ReactNode;
  showDivider?: boolean;
  showEditorCard?: boolean;
}) {
  const session = await getServerAuthSession();

  let bookmarks: Awaited<ReturnType<typeof api.bookmarks.getBookmarks>> = {
    bookmarks: [],
    nextCursor: null,
  };
  try {
    if (session) {
      bookmarks = await api.bookmarks.getBookmarks({
        ...query,
      });
    } else {
      const guestCaller = await createGuestCaller();
      bookmarks = await guestCaller.bookmarks.getBookmarks({
        ...query,
      });
    }
  } catch (error) {
    console.error("Failed to fetch initial bookmarks:", error);
  }

  return (
    <div className="flex flex-col gap-3">
      {header}
      {showDivider && <Separator />}
      <UpdatableBookmarksGrid
        query={query}
        bookmarks={bookmarks}
        showEditorCard={showEditorCard}
      />
    </div>
  );
}
