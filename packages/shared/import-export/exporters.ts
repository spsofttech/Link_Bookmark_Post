import * as XLSX from "xlsx";
import { z } from "zod";

import { BookmarkTypes, ZBookmark } from "../types/bookmarks";
import { ZBookmarkList } from "../types/lists";
import { escapeHtml } from "../utils/htmlUtils";
import { isAllowedBookmarkUrl } from "../utils/url";

export const zExportListSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string(),
  type: z.enum(["manual", "smart"]),
  query: z.string().nullable(),
  parentId: z.string().nullable(),
});

export const zExportBookmarkSchema = z.object({
  id: z.string().optional(),
  createdAt: z.number(),
  title: z.string().nullable(),
  tags: z.array(z.string()),
  lists: z.array(z.string()).optional().default([]),
  content: z
    .discriminatedUnion("type", [
      z.object({
        type: z.literal(BookmarkTypes.LINK),
        url: z.string(),
        description: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        favicon: z.string().nullable().optional(),
        author: z.string().nullable().optional(),
        publisher: z.string().nullable().optional(),
      }),
      z.object({
        type: z.literal(BookmarkTypes.TEXT),
        text: z.string(),
      }),
      z.object({
        type: z.literal(BookmarkTypes.ASSET),
        assetId: z.string().optional(),
      }),
    ])
    .nullable(),
  description: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  note: z.string().nullable(),
  archived: z.boolean().optional().default(false),
  favourited: z.boolean().optional().default(false),
  imageUrl: z.string().nullable().optional(),
});

export const zExportSchema = z.object({
  bookmarks: z.array(zExportBookmarkSchema),
  lists: z.array(zExportListSchema).optional().default([]),
});

export function toExportFormat(
  bookmark: ZBookmark,
  listIds?: string[],
): z.infer<typeof zExportBookmarkSchema> {
  let content = null;
  switch (bookmark.content.type) {
    case BookmarkTypes.LINK: {
      content = {
        type: BookmarkTypes.LINK as const,
        url: bookmark.content.url,
        description: bookmark.content.description ?? null,
        imageUrl: bookmark.content.imageUrl ?? null,
        favicon: bookmark.content.favicon ?? null,
        author: bookmark.content.author ?? null,
        publisher: bookmark.content.publisher ?? null,
      };
      break;
    }
    case BookmarkTypes.TEXT: {
      content = {
        type: BookmarkTypes.TEXT as const,
        text: bookmark.content.text,
      };
      break;
    }
    case BookmarkTypes.ASSET: {
      const assetContent = bookmark.content as {
        assetId?: string;
        id?: string;
      };
      content = {
        type: BookmarkTypes.ASSET as const,
        assetId: assetContent?.assetId ?? assetContent?.id ?? "",
      };
      break;
    }
    default: {
      const linkContent = bookmark.content as { url?: string };
      content = {
        type: BookmarkTypes.LINK as const,
        url: linkContent?.url || "",
      };
      break;
    }
  }

  const bannerAsset = bookmark.assets?.find(
    (a) => a.assetType === "bannerImage",
  );
  const imageUrl =
    bookmark.content.type === BookmarkTypes.LINK
      ? (bookmark.content.imageUrl ?? (bannerAsset ? bannerAsset.id : null))
      : bannerAsset
        ? bannerAsset.id
        : null;

  return {
    id: bookmark.id,
    createdAt: Math.floor(bookmark.createdAt.getTime() / 1000),
    title:
      bookmark.title ??
      (bookmark.content.type === BookmarkTypes.LINK
        ? (bookmark.content.title ?? null)
        : null),
    tags: bookmark.tags.map((t) => t.name),
    lists: listIds ?? [],
    content,
    description:
      bookmark.content.type === BookmarkTypes.LINK
        ? (bookmark.content.description ?? null)
        : null,
    summary: bookmark.summary ?? null,
    note: bookmark.note ?? null,
    archived: bookmark.archived,
    favourited: bookmark.favourited ?? false,
    imageUrl,
  };
}

export function toExportListFormat(
  list: ZBookmarkList,
): z.infer<typeof zExportListSchema> {
  return {
    id: list.id,
    name: list.name,
    description: list.description ?? null,
    icon: list.icon,
    type: list.type,
    query: list.query ?? null,
    parentId: list.parentId,
  };
}

export function toNetscapeFormat(bookmarks: ZBookmark[]): string {
  const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>`;

  const footer = `</DL><p>`;

  const bookmarkEntries = bookmarks
    .map((bookmark) => {
      if (bookmark.content?.type !== BookmarkTypes.LINK) {
        return "";
      }
      // Drop unsafe schemes (javascript:, data:, ...) that may predate
      // URL validation, so they can't execute when the export is opened.
      if (!isAllowedBookmarkUrl(bookmark.content.url)) {
        return "";
      }
      const addDate = bookmark.createdAt
        ? `ADD_DATE="${Math.floor(bookmark.createdAt.getTime() / 1000)}"`
        : "";

      // Tag names are attacker-influenced (the AI tagger writes them straight
      // from model output), so they have to be escaped like any other value
      // interpolated into an attribute.
      const tagNames = bookmark.tags.map((t) => t.name).join(",");
      const tags = tagNames.length > 0 ? `TAGS="${escapeHtml(tagNames)}"` : "";

      const encodedUrl = escapeHtml(encodeURI(bookmark.content.url));
      const displayTitle = bookmark.title ?? bookmark.content.url;
      const encodedTitle = escapeHtml(displayTitle);

      return `    <DT><A HREF="${encodedUrl}" ${addDate} ${tags}>${encodedTitle}</A>`;
    })
    .filter(Boolean)
    .join("\n");

  return `${header}\n${bookmarkEntries}\n${footer}`;
}

export function toExcelFormat(
  bookmarks: ZBookmark[],
  bookmarkListNamesMap?: Map<string, string[]>,
): Uint8Array {
  const data = bookmarks.map((b, idx) => {
    const content = b.content;
    let url = "";
    let textContent = "";
    let description = b.summary ?? "";
    let defaultTitle = "";
    let thumbUrl = "";

    if (content.type === BookmarkTypes.LINK) {
      url = content.url;
      description = content.description ?? b.summary ?? "";
      defaultTitle = content.title ?? url;
      thumbUrl = content.imageUrl ?? "";
    } else if (content.type === BookmarkTypes.TEXT) {
      textContent = content.text;
      defaultTitle = content.text.slice(0, 100);
    }

    if (!thumbUrl) {
      const bannerAsset = b.assets?.find((a) => a.assetType === "bannerImage");
      if (bannerAsset) {
        thumbUrl = bannerAsset.id;
      }
    }

    const title = b.title ?? defaultTitle;
    const tags = b.tags.map((t) => t.name).join(", ");
    const lists = bookmarkListNamesMap?.get(b.id)?.join(", ") ?? "";
    const note = b.note ?? "";
    const status = b.archived ? "Archived" : "Saved";
    const favourited = b.favourited ? "Yes" : "No";
    const dateSaved = b.createdAt ? b.createdAt.toISOString() : "";

    return {
      "No.": idx + 1,
      ID: b.id,
      Type: b.content.type,
      Title: title,
      "Original Post Link / URL": url,
      "Text Content": textContent,
      Description: description,
      "Note / Takeaways": note,
      "Tags / Categories": tags,
      Lists: lists,
      Status: status,
      Favourited: favourited,
      "Date Saved": dateSaved,
      Thumbnail: thumbUrl,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 8 },
    { wch: 35 },
    { wch: 45 },
    { wch: 40 },
    { wch: 40 },
    { wch: 40 },
    { wch: 25 },
    { wch: 20 },
    { wch: 10 },
    { wch: 12 },
    { wch: 22 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bookmarks");
  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  }) as Uint8Array;
}

export function toCsvFormat(
  bookmarks: ZBookmark[],
  bookmarkListNamesMap?: Map<string, string[]>,
): string {
  const headers = [
    "No.",
    "ID",
    "Type",
    "Title",
    "Original Post Link / URL",
    "Text Content",
    "Description",
    "Note / Takeaways",
    "Tags / Categories",
    "Lists",
    "Status",
    "Favourited",
    "Date Saved",
    "Thumbnail",
  ];

  const escapeCsv = (str: unknown) => {
    if (str === null || str === undefined) return '""';
    const val = String(str).replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows = bookmarks.map((b, idx) => {
    const content = b.content;
    let url = "";
    let textContent = "";
    let description = b.summary ?? "";
    let defaultTitle = "";
    let thumbUrl = "";

    if (content.type === BookmarkTypes.LINK) {
      url = content.url;
      description = content.description ?? b.summary ?? "";
      defaultTitle = content.title ?? url;
      thumbUrl = content.imageUrl ?? "";
    } else if (content.type === BookmarkTypes.TEXT) {
      textContent = content.text;
      defaultTitle = content.text.slice(0, 100);
    }

    if (!thumbUrl) {
      const bannerAsset = b.assets?.find((a) => a.assetType === "bannerImage");
      if (bannerAsset) {
        thumbUrl = bannerAsset.id;
      }
    }

    const title = b.title ?? defaultTitle;
    const tags = b.tags.map((t) => t.name).join(", ");
    const lists = bookmarkListNamesMap?.get(b.id)?.join(", ") ?? "";
    const note = b.note ?? "";
    const status = b.archived ? "Archived" : "Saved";
    const favourited = b.favourited ? "Yes" : "No";
    const dateSaved = b.createdAt ? b.createdAt.toISOString() : "";

    return [
      escapeCsv(idx + 1),
      escapeCsv(b.id),
      escapeCsv(b.content.type),
      escapeCsv(title),
      escapeCsv(url),
      escapeCsv(textContent),
      escapeCsv(description),
      escapeCsv(note),
      escapeCsv(tags),
      escapeCsv(lists),
      escapeCsv(status),
      escapeCsv(favourited),
      escapeCsv(dateSaved),
      escapeCsv(thumbUrl),
    ].join(",");
  });

  // Include UTF-8 BOM so Excel opens special characters correctly
  return "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
}
