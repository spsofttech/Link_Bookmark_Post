import React from "react";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import { api } from "@/server/api/client";

export default async function BookmarksPage(props: {
  searchParams?: Promise<{
    includeArchived?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  let userSettings = { archiveDisplayBehaviour: "show" };
  try {
    userSettings = await api.users.settings();
  } catch {
    // fallback default
  }

  const includeArchived =
    searchParams?.includeArchived !== undefined
      ? searchParams.includeArchived === "true"
      : userSettings.archiveDisplayBehaviour === "show";

  return (
    <div>
      <Bookmarks
        query={{ archived: !includeArchived ? false : undefined }}
        showEditorCard={true}
      />
    </div>
  );
}
