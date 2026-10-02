import type { Metadata } from "next";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import TagHeader from "@/components/dashboard/tags/TagHeader";
import { api } from "@/server/api/client";

export async function generateMetadata(props: {
  params: Promise<{ tagId: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  let decodedName = params.tagId;
  try {
    decodedName = decodeURIComponent(params.tagId);
  } catch {
    decodedName = params.tagId;
  }
  try {
    const tag = await api.tags.get({ tagId: params.tagId });
    return {
      title: `${tag.name} | Save Content`,
    };
  } catch {
    return {
      title: `${decodedName} | Save Content`,
    };
  }
}

export default async function TagPage(props: {
  params: Promise<{ tagId: string }>;
  searchParams?: Promise<{
    includeArchived?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  let decodedName = params.tagId;
  try {
    decodedName = decodeURIComponent(params.tagId);
  } catch {
    decodedName = params.tagId;
  }

  let tag;
  try {
    tag = await api.tags.get({ tagId: params.tagId });
  } catch {
    tag = {
      id: params.tagId,
      name: decodedName,
      numBookmarks: 0,
      numBookmarksByAttachedType: { ai: 0, human: 0 },
    };
  }
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
    <Bookmarks
      header={<TagHeader initialData={tag} />}
      showDivider={true}
      query={{
        tagId: tag.id,
        archived: !includeArchived ? false : undefined,
      }}
      showEditorCard={true}
    />
  );
}
