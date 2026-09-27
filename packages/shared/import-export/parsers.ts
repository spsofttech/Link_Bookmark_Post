// Copied from https://gist.github.com/devster31/4e8c6548fd16ffb75c02e6f24e27f9b9

import type { AnyNode } from "domhandler";
import * as cheerio from "cheerio";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { z } from "zod";

import { BookmarkTypes } from "../types/bookmarks";
import { zExportSchema } from "./exporters";

export type ImportSource =
  | "html"
  | "pocket"
  | "matter"
  | "omnivore"
  | "karakeep"
  | "linkwarden"
  | "tab-session-manager"
  | "mymind"
  | "readwise-reader"
  | "instapaper"
  | "onetab"
  | "csv"
  | "json"
  | "excel";

export interface ParsedBookmark {
  title: string;
  content?:
    | { type: BookmarkTypes.LINK; url: string }
    | { type: BookmarkTypes.TEXT; text: string };
  tags: string[];
  addDate?: number;
  notes?: string;
  description?: string;
  archived?: boolean;
  favourited?: boolean;
  imageUrl?: string;
  lists?: string[];
  paths: string[][];
  // Optional list IDs from the source file (used with top-level `lists`).
  listExternalIds?: string[];
}

export interface ParsedImportList {
  externalId: string;
  name: string;
  icon?: string;
  description?: string;
  parentExternalId: string | null;
  type: "manual" | "smart";
  query?: string;
}

export interface ParsedImportFile {
  bookmarks: ParsedBookmark[];
  lists: ParsedImportList[];
}

function parseNetscapeBookmarkFile(textContent: string): ParsedBookmark[] {
  if (!textContent.startsWith("<!DOCTYPE NETSCAPE-Bookmark-file-1>")) {
    throw Error("The uploaded html file does not seem to be a bookmark file");
  }

  const $ = cheerio.load(textContent);
  const bookmarks: ParsedBookmark[] = [];

  // Recursively traverse the bookmark hierarchy top-down
  function traverseFolder(
    element: cheerio.Cheerio<AnyNode>,
    currentPath: string[],
  ) {
    element.children().each((_index, child) => {
      const $child = $(child);

      // Check if this is a folder (DT with H3)
      const h3 = $child.children("h3").first();
      if (h3.length > 0) {
        const folderName = h3.text().trim() || "Unnamed";
        const newPath = [...currentPath, folderName];

        // Find the DL that follows this folder and recurse into it
        const dl = $child.children("dl").first();
        if (dl.length > 0) {
          traverseFolder(dl, newPath);
        }
      } else {
        // Check if this is a bookmark (DT with A)
        const anchor = $child.children("a").first();
        if (anchor.length > 0) {
          const addDate = anchor.attr("add_date");
          const tagsStr = anchor.attr("tags");
          const tags = tagsStr && tagsStr.length > 0 ? tagsStr.split(",") : [];
          const url = anchor.attr("href");

          bookmarks.push({
            title: anchor.text(),
            content: url
              ? { type: BookmarkTypes.LINK as const, url }
              : undefined,
            tags,
            addDate:
              typeof addDate === "undefined" ? undefined : parseInt(addDate),
            paths: [currentPath],
          });
        }
      }
    });
  }

  // Start traversal from the root DL element
  const rootDl = $("dl").first();
  if (rootDl.length > 0) {
    traverseFolder(rootDl, []);
  }

  return bookmarks;
}

function parsePocketBookmarkFile(textContent: string): ParsedBookmark[] {
  const records = parse(textContent, {
    columns: true,
    skip_empty_lines: true,
  }) as {
    title: string;
    url: string;
    time_added: string;
    tags: string;
    status?: string;
  }[];

  return records.map((record) => {
    return {
      title: record.title,
      content: { type: BookmarkTypes.LINK as const, url: record.url },
      tags: record.tags.length > 0 ? record.tags.split("|") : [],
      addDate: parseInt(record.time_added),
      archived: record.status === "archive",
      paths: [], // TODO
    };
  });
}

function parseMatterBookmarkFile(textContent: string): ParsedBookmark[] {
  const zMatterRecordSchema = z.object({
    Title: z.string(),
    Author: z.string(),
    Publisher: z.string(),
    URL: z.string(),
    Tags: z
      .string()
      .transform((tags) => (tags.length > 0 ? tags.split(";") : [])),
    "Word Count": z.string(),
    "In Queue": z.string().transform((inQueue) => inQueue === "False"),
    Favorited: z.string(),
    Read: z.string(),
    Highlight_Count: z.string(),
    "Last Interaction Date": z
      .string()
      .transform((date) => Date.parse(date) / 1000),
    "File Id": z.string(),
  });

  const zMatterExportSchema = z.array(zMatterRecordSchema);

  const records = parse(textContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const parsed = zMatterExportSchema.safeParse(records);
  if (!parsed.success) {
    throw new Error(
      `The uploaded CSV file contains an invalid Matter bookmark file: ${parsed.error.toString()}`,
    );
  }

  return parsed.data.map((record) => {
    return {
      title: record.Title,
      content: { type: BookmarkTypes.LINK as const, url: record.URL },
      tags: record.Tags,
      addDate: record["Last Interaction Date"],
      archived: record["In Queue"],
      paths: [], // TODO
    };
  });
}

function parseKarakeepBookmarkFile(textContent: string): ParsedImportFile {
  const parsed = zExportSchema.safeParse(JSON.parse(textContent));
  if (!parsed.success) {
    throw new Error(
      `The uploaded JSON file contains an invalid bookmark file: ${parsed.error.toString()}`,
    );
  }

  const exportedLists = parsed.data.lists ?? [];
  const parsedLists: ParsedImportList[] = exportedLists.map((list) => ({
    externalId: list.id,
    name: list.name,
    icon: list.icon,
    description: list.description ?? undefined,
    parentExternalId: list.parentId,
    type: list.type,
    query: list.type === "smart" ? (list.query ?? undefined) : undefined,
  }));

  const manualListIds = new Set(
    exportedLists.filter((l) => l.type === "manual").map((l) => l.id),
  );

  const parsedBookmarks = parsed.data.bookmarks.map((bookmark) => {
    let content = undefined;
    if (bookmark.content?.type == BookmarkTypes.LINK) {
      content = {
        type: BookmarkTypes.LINK as const,
        url: bookmark.content.url,
      };
    } else if (bookmark.content?.type == BookmarkTypes.TEXT) {
      content = {
        type: BookmarkTypes.TEXT as const,
        text: bookmark.content.text,
      };
    }

    return {
      title: bookmark.title ?? "",
      content,
      tags: bookmark.tags,
      addDate: bookmark.createdAt,
      notes: bookmark.note ?? undefined,
      description:
        bookmark.description ??
        (bookmark.content?.type === BookmarkTypes.LINK
          ? bookmark.content.description
          : undefined) ??
        undefined,
      favourited: bookmark.favourited,
      imageUrl:
        bookmark.imageUrl ??
        (bookmark.content?.type === BookmarkTypes.LINK
          ? bookmark.content.imageUrl
          : undefined) ??
        undefined,
      archived: bookmark.archived,
      paths: [],
      listExternalIds: (bookmark.lists ?? []).filter((listId) =>
        manualListIds.has(listId),
      ),
    };
  });

  return {
    bookmarks: parsedBookmarks,
    lists: parsedLists,
  };
}

function parseOmnivoreBookmarkFile(textContent: string): ParsedBookmark[] {
  const zOmnivoreExportSchema = z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      labels: z.array(z.string()),
      savedAt: z.coerce.date(),
      state: z.string().optional(),
    }),
  );

  const parsed = zOmnivoreExportSchema.safeParse(JSON.parse(textContent));
  if (!parsed.success) {
    throw new Error(
      `The uploaded JSON file contains an invalid omnivore bookmark file: ${parsed.error.toString()}`,
    );
  }

  return parsed.data.map((bookmark) => {
    return {
      title: bookmark.title ?? "",
      content: { type: BookmarkTypes.LINK as const, url: bookmark.url },
      tags: bookmark.labels,
      addDate: bookmark.savedAt.getTime() / 1000,
      archived: bookmark.state === "Archived",
      paths: [],
    };
  });
}

function parseLinkwardenBookmarkFile(textContent: string): ParsedBookmark[] {
  const zLinkwardenExportSchema = z.object({
    collections: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        parentId: z.number().nullable(),
        links: z.array(
          z.object({
            name: z.string(),
            url: z.string(),
            tags: z.array(z.object({ name: z.string() })),
            createdAt: z.coerce.date(),
          }),
        ),
      }),
    ),
  });

  const parsed = zLinkwardenExportSchema.safeParse(JSON.parse(textContent));
  if (!parsed.success) {
    throw new Error(
      `The uploaded JSON file contains an invalid Linkwarden bookmark file: ${parsed.error.toString()}`,
    );
  }

  // Build a map of collection id -> collection for path resolution
  const collectionsById = new Map(
    parsed.data.collections.map((c) => [c.id, c]),
  );

  // Resolve the full path for a collection by walking up the parent chain
  function getCollectionPath(collectionId: number): string[] {
    const path: string[] = [];
    let currentId: number | null = collectionId;
    while (currentId !== null) {
      const collection = collectionsById.get(currentId);
      if (!collection) break;
      path.unshift(collection.name);
      currentId = collection.parentId;
    }
    return path;
  }

  return parsed.data.collections.flatMap((collection) => {
    const collectionPath = getCollectionPath(collection.id);
    return collection.links.map((bookmark) => ({
      title: bookmark.name ?? "",
      content: { type: BookmarkTypes.LINK as const, url: bookmark.url },
      tags: bookmark.tags.map((tag) => tag.name),
      addDate: bookmark.createdAt.getTime() / 1000,
      paths: [collectionPath],
    }));
  });
}

function parseTabSessionManagerStateFile(
  textContent: string,
): ParsedBookmark[] {
  const zTab = z.object({
    url: z.string(),
    title: z.string(),
    lastAccessed: z.number(),
  });

  const zSession = z.object({
    windows: z.record(z.string(), z.record(z.string(), zTab)),
    date: z.number(),
  });

  const zTabSessionManagerSchema = z.array(zSession);

  const parsed = zTabSessionManagerSchema.safeParse(JSON.parse(textContent));
  if (!parsed.success) {
    throw new Error(
      `The uploaded JSON file contains an invalid Tab Session Manager bookmark file: ${parsed.error.toString()}`,
    );
  }

  // Get the object in data that has the most recent `date`
  const { windows } = parsed.data.reduce((prev, curr) =>
    prev.date > curr.date ? prev : curr,
  );

  return Object.values(windows).flatMap((window) =>
    Object.values(window).map((tab) => ({
      title: tab.title,
      content: { type: BookmarkTypes.LINK as const, url: tab.url },
      tags: [],
      addDate: tab.lastAccessed,
      paths: [], // Tab Session Manager doesn't have folders
    })),
  );
}

function parseMymindBookmarkFile(textContent: string): ParsedBookmark[] {
  const zMymindRecordSchema = z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    url: z.string(),
    content: z.string(),
    note: z.string(),
    tags: z.string(),
    created: z.string(),
  });

  const zMymindExportSchema = z.array(zMymindRecordSchema);

  const records = parse(textContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const parsed = zMymindExportSchema.safeParse(records);
  if (!parsed.success) {
    throw new Error(
      `The uploaded CSV file contains an invalid mymind bookmark file: ${parsed.error.toString()}`,
    );
  }

  return parsed.data.map((record) => {
    // Determine content type based on presence of URL and content fields
    let content: ParsedBookmark["content"];
    if (record.url && record.url.trim().length > 0) {
      content = { type: BookmarkTypes.LINK as const, url: record.url.trim() };
    } else if (record.content && record.content.trim().length > 0) {
      content = {
        type: BookmarkTypes.TEXT as const,
        text: record.content.trim(),
      };
    }

    // Parse tags from comma-separated string
    const tags =
      record.tags && record.tags.trim().length > 0
        ? record.tags.split(",").map((tag) => tag.trim())
        : [];

    // Parse created date to timestamp (in seconds)
    const addDate = record.created
      ? new Date(record.created).getTime() / 1000
      : undefined;

    return {
      title: record.title || "",
      content,
      tags,
      addDate,
      notes:
        record.note && record.note.trim().length > 0 ? record.note : undefined,
      paths: [], // mymind doesn't have folder structure
    };
  });
}

function parseInstapaperBookmarkFile(textContent: string): ParsedBookmark[] {
  const zInstapaperRecordScheme = z.object({
    URL: z.string(),
    Title: z.string(),
    Selection: z.string(),
    Folder: z.string(),
    Timestamp: z.string(),
    Tags: z.string(),
  });

  const zInstapaperExportScheme = z.array(zInstapaperRecordScheme);

  const record = parse(textContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const parsed = zInstapaperExportScheme.safeParse(record);

  if (!parsed.success) {
    throw new Error(
      `CSV file contains an invalid instapaper bookmark file: ${parsed.error.toString()}`,
    );
  }

  return parsed.data.map((record): ParsedBookmark => {
    let content: ParsedBookmark["content"];
    if (record.URL && record.URL.trim().length > 0) {
      content = { type: BookmarkTypes.LINK as const, url: record.URL.trim() };
    } else if (record.Selection && record.Selection.trim().length > 0) {
      content = {
        type: BookmarkTypes.TEXT as const,
        text: record.Selection.trim(),
      };
    }

    const addDate = parseInt(record.Timestamp);

    let tags: string[] = [];
    try {
      const parsedTags = JSON.parse(record.Tags);
      if (Array.isArray(parsedTags)) {
        tags = parsedTags.map((tag) => tag.toString().trim());
      }
    } catch {
      tags = [];
    }

    let archived = false;
    const paths = [];
    if (record.Folder === "Archive") {
      archived = true;
    } else if (record.Folder === "Unread") {
      // This maps to home feed in instapaper, do nothing.
    } else {
      // Instapaper "Starred" should map to favorites in karakeep, but
      // apparently instapaper export only includes on folder per bookmark
      // so for now, we'll treat the "Starred" as a normal folder.
      paths.push([record.Folder]);
    }

    return {
      title: record.Title || "",
      content,
      addDate,
      tags,
      paths,
      archived,
    };
  });
}

function parseReadwiseReaderBookmarkFile(
  textContent: string,
): ParsedBookmark[] {
  const zReadwiseReaderRecordScheme = z.object({
    Title: z.string(),
    URL: z.string(),
    ID: z.string(),
    "Document tags": z.string(),
    "Saved date": z.string(),
    "Reading progress": z.string(),
    Location: z.string(),
    Seen: z.enum(["True", "False"]),
  });

  const zReadwiseReaderExportScheme = z.array(zReadwiseReaderRecordScheme);

  const record = parse(textContent, {
    columns: true,
    skip_empty_lines: true,
    cast: function (value, context) {
      //Replace for json parsing; original comes with \' instead of \" so it's not json parsable.
      if (context.column === "Document tags") {
        return value
          .replace(/\\'/g, "'")
          .replace(/(^|\[|,)\s*'/g, '$1"')
          .replace(/'\s*(]|,|$)/g, '"$1')
          .replace(/""/g, '"');
      }
      return value;
    },
  });

  const parsed = zReadwiseReaderExportScheme.safeParse(record);

  if (!parsed.success) {
    throw new Error(
      `CSV file contains an invalid Readwise Reader bookmark file: ${parsed.error.toString()}`,
    );
  }

  //Feed (RSS) articles are included automatically, so filter them. Only include actively added links.
  const feedFilteredArticles = parsed.data.filter(
    (record) => record.Location !== "feed",
  );
  const emptyFilteredArticles = feedFilteredArticles.filter(
    (record) => record.URL && record.URL.trim().length > 0,
  );

  return emptyFilteredArticles.map((record) => {
    let content: ParsedBookmark["content"] = {
      type: BookmarkTypes.LINK as const,
      url: record.URL.trim(),
    };

    const addDate = new Date(record["Saved date"]).getTime() / 1000;

    let tags: string[] = [];
    try {
      const documentTags = record["Document tags"];
      if (documentTags) {
        const parsedTags = JSON.parse(documentTags);
        if (Array.isArray(parsedTags)) {
          tags = parsedTags.map((tag) => tag.toString().trim());
        }
      }
    } catch {
      tags = [];
    }

    return {
      title: record.Title || "",
      content,
      addDate,
      tags,
      paths: [], // TODO
      archived: record.Location === "archive",
    };
  });
}

function parseOneTabFile(textContent: string): ParsedBookmark[] {
  const bookmarks: ParsedBookmark[] = [];

  for (const line of textContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // OneTab format: "URL | Title" or just "URL"
    const pipeIndex = trimmed.indexOf(" | ");
    let url: string;
    let title: string;

    if (pipeIndex !== -1) {
      url = trimmed.substring(0, pipeIndex).trim();
      title = trimmed.substring(pipeIndex + 3).trim();
    } else {
      url = trimmed;
      title = "";
    }

    // Skip lines that don't look like URLs (group headers, timestamps, etc.)
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      continue;
    }

    bookmarks.push({
      title,
      content: { type: BookmarkTypes.LINK as const, url },
      tags: [],
      paths: [],
    });
  }

  return bookmarks;
}

function deduplicateBookmarks(bookmarks: ParsedBookmark[]): ParsedBookmark[] {
  const urlMap = new Map<string, ParsedBookmark>();
  const nonUrlBookmarks: ParsedBookmark[] = [];

  for (const bookmark of bookmarks) {
    const url =
      bookmark.content?.type === BookmarkTypes.LINK
        ? bookmark.content.url.trim()
        : null;

    if (!url) {
      nonUrlBookmarks.push(bookmark);
      continue;
    }

    const existing = urlMap.get(url);
    if (!existing) {
      urlMap.set(url, {
        ...bookmark,
        tags: [...(bookmark.tags ?? [])],
        paths: (bookmark.paths ?? []).map((p) => [...p]),
        lists: bookmark.lists ? [...bookmark.lists] : undefined,
        listExternalIds: bookmark.listExternalIds
          ? [...bookmark.listExternalIds]
          : undefined,
      });
      continue;
    }

    // Merge metadata into existing
    if (!existing.title && bookmark.title) {
      existing.title = bookmark.title;
    }

    // Merge tags
    if (bookmark.tags) {
      for (const tag of bookmark.tags) {
        if (tag && !existing.tags.includes(tag)) {
          existing.tags.push(tag);
        }
      }
    }

    // Merge paths
    if (bookmark.paths) {
      for (const newPath of bookmark.paths) {
        const pathExists = existing.paths.some(
          (p) =>
            p.length === newPath.length &&
            p.every((segment, idx) => segment === newPath[idx]),
        );
        if (!pathExists) {
          existing.paths.push([...newPath]);
        }
      }
    }

    // Merge list external IDs / lists
    if (bookmark.listExternalIds) {
      existing.listExternalIds = existing.listExternalIds ?? [];
      for (const id of bookmark.listExternalIds) {
        if (!existing.listExternalIds.includes(id)) {
          existing.listExternalIds.push(id);
        }
      }
    }
    if (bookmark.lists) {
      existing.lists = existing.lists ?? [];
      for (const l of bookmark.lists) {
        if (!existing.lists.includes(l)) {
          existing.lists.push(l);
        }
      }
    }

    // Keep earlier addDate
    if (bookmark.addDate !== undefined) {
      if (
        existing.addDate === undefined ||
        bookmark.addDate < existing.addDate
      ) {
        existing.addDate = bookmark.addDate;
      }
    }

    // Merge notes
    if (bookmark.notes && bookmark.notes.trim()) {
      if (!existing.notes) {
        existing.notes = bookmark.notes;
      } else if (!existing.notes.includes(bookmark.notes.trim())) {
        existing.notes = `${existing.notes}\n\n${bookmark.notes.trim()}`;
      }
    }

    // Merge description, image, archived, favourited
    if (!existing.description && bookmark.description) {
      existing.description = bookmark.description;
    }
    if (!existing.imageUrl && bookmark.imageUrl) {
      existing.imageUrl = bookmark.imageUrl;
    }
    if (existing.archived === undefined && bookmark.archived !== undefined) {
      existing.archived = bookmark.archived;
    }
    if (
      existing.favourited === undefined &&
      bookmark.favourited !== undefined
    ) {
      existing.favourited = bookmark.favourited;
    }
  }

  return [...urlMap.values(), ...nonUrlBookmarks];
}

function extractUniversalRecord(
  record: Record<string, unknown>,
): ParsedBookmark | null {
  if (!record || typeof record !== "object") return null;

  const recordContent = record.content as Record<string, unknown> | undefined;

  // 1. Extract URL
  const rawUrl =
    record["Original Post Link / URL"] ||
    record["Original Post Link"] ||
    record["Post Link"] ||
    record["Original Link"] ||
    record.url ||
    record.URL ||
    record.link ||
    record.Link ||
    record.href ||
    record.website ||
    recordContent?.url ||
    "";
  const url = typeof rawUrl === "string" ? rawUrl.trim() : "";

  // 2. Extract Text Content (for text notes / posts)
  const rawText =
    record["Text Content"] ||
    record["text content"] ||
    recordContent?.text ||
    record.textContent ||
    record.text ||
    record.Text ||
    record.body ||
    record.post ||
    "";
  const textContent = typeof rawText === "string" ? rawText.trim() : "";

  // 3. Extract 1-line title
  const takeaway = String(
    record["Core Idea / 1-Line Takeaway"] || record.takeaway || "",
  ).trim();
  const rawLines = takeaway
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const cleanLines = rawLines
    .map((l) =>
      l
        .replace(/^[•\s-*"']+/, "")
        .replace(/["']+$/, "")
        .trim(),
    )
    .filter(Boolean);

  let title = "";
  if (
    record.title ||
    record.Title ||
    record.name ||
    record.Name ||
    record.Subject ||
    record.headline
  ) {
    const rawTitle =
      record.title ||
      record.Title ||
      record.name ||
      record.Name ||
      record.Subject ||
      record.headline;
    title = String(rawTitle).trim().split("\n")[0].slice(0, 200);
  } else if (cleanLines.length > 0) {
    title = cleanLines[0].slice(0, 200);
  } else if (textContent) {
    title = textContent.split("\n")[0].slice(0, 200);
  } else if (url) {
    title = url;
  } else {
    title = "Untitled";
  }

  // 4. Extract Description
  const description = String(
    record.description ||
      record.Description ||
      record.summary ||
      record.Summary ||
      record.Snippet ||
      recordContent?.description ||
      "",
  ).trim();

  // 5. Extract Notes and ALL extra raw columns without loss
  const standardFields = new Set([
    "no.",
    "no",
    "id",
    "type",
    "title",
    "name",
    "headline",
    "subject",
    "url",
    "link",
    "original post link",
    "original post link / url",
    "original link",
    "post link",
    "href",
    "website",
    "text content",
    "text",
    "body",
    "post",
    "content",
    "textcontent",
    "description",
    "desc",
    "summary",
    "snippet",
    "note",
    "notes",
    "note / takeaways",
    "takeaway",
    "core idea / 1-line takeaway",
    "comments",
    "tags",
    "tags / categories",
    "category",
    "categories",
    "labels",
    "platform",
    "post type",
    "status",
    "archived",
    "state",
    "favourited",
    "favorite",
    "starred",
    "star",
    "date saved",
    "date",
    "createdat",
    "created at",
    "time_added",
    "adddate",
    "thumbnail",
    "realthumb",
    "image",
    "imageurl",
    "thumb",
    "lists",
    "list",
    "folder",
    "paths",
  ]);

  const noteParts: string[] = [];
  const baseNote =
    record["Note / Takeaways"] ||
    record.note ||
    record.notes ||
    record.Note ||
    record.Notes ||
    "";
  if (baseNote) {
    noteParts.push(String(baseNote).trim());
  }
  if (takeaway && !baseNote.toString().includes(takeaway)) {
    noteParts.push(takeaway);
  }

  // Capture every single remaining raw column without loss
  for (const [key, val] of Object.entries(record)) {
    if (val === null || val === undefined || val === "") continue;
    const cleanKey = key.trim().toLowerCase();
    if (!standardFields.has(cleanKey)) {
      const displayVal =
        typeof val === "object" ? JSON.stringify(val) : String(val).trim();
      noteParts.push(`${key.trim()}: ${displayVal}`);
    }
  }

  const notes = noteParts.join("\n\n");

  // 6. Extract Tags
  const rawTags =
    record["Tags / Categories"] ||
    record.tags ||
    record.Tags ||
    record.Category ||
    record.category ||
    record.Labels ||
    record.labels ||
    [];
  const tags: string[] = [];
  if (Array.isArray(rawTags)) {
    for (const t of rawTags) {
      const s = String(t).trim();
      if (s && !tags.includes(s)) tags.push(s);
    }
  } else if (typeof rawTags === "string") {
    for (const s of rawTags
      .split(/[,|;\n]/)
      .map((x) => x.trim())
      .filter(Boolean)) {
      if (!tags.includes(s)) tags.push(s);
    }
  }
  if (record.Platform && typeof record.Platform === "string") {
    const p = record.Platform.trim();
    if (p && !tags.includes(p)) tags.push(p);
  }

  // 7. Extract Lists / Folders
  const rawLists =
    record.Lists ||
    record.lists ||
    record.List ||
    record.list ||
    record.Folder ||
    record.folder ||
    [];
  const lists: string[] = [];
  if (Array.isArray(rawLists)) {
    for (const l of rawLists) {
      const s = String(l).trim();
      if (s && !lists.includes(s)) lists.push(s);
    }
  } else if (typeof rawLists === "string") {
    for (const s of rawLists
      .split(/[,|;\n]/)
      .map((x) => x.trim())
      .filter(Boolean)) {
      if (!lists.includes(s)) lists.push(s);
    }
  }

  // 8. Date
  const addDateStr =
    record["Date Saved"] ||
    record.dateSaved ||
    record.createdAt ||
    record.Date ||
    record.time_added ||
    record.addDate;
  let addDate: number | undefined;
  if (addDateStr !== undefined && addDateStr !== null && addDateStr !== "") {
    if (typeof addDateStr === "number") {
      addDate =
        addDateStr > 1e11
          ? Math.floor(addDateStr / 1000)
          : Math.floor(addDateStr);
    } else {
      const num = Number(addDateStr);
      if (!isNaN(num) && num > 1e8) {
        addDate = num > 1e11 ? Math.floor(num / 1000) : Math.floor(num);
      } else {
        const parsedMs = Date.parse(String(addDateStr));
        if (!isNaN(parsedMs)) {
          addDate = Math.floor(parsedMs / 1000);
        }
      }
    }
  }

  // 9. Archived / Status
  const statusStr = String(record.Status || record.status || "").toLowerCase();
  const archived =
    statusStr === "archived" ||
    statusStr === "true" ||
    record.archived === true ||
    record.Archived === true;

  // 10. Favourited
  const favStr = String(
    record.Favourited ||
      record.favourited ||
      record.Favorite ||
      record.favorite ||
      record.Starred ||
      record.starred ||
      "",
  ).toLowerCase();
  const favourited =
    favStr === "yes" ||
    favStr === "true" ||
    favStr === "1" ||
    record.favourited === true ||
    record.Favourited === true;

  // 11. Thumbnail / Image
  const rawImage =
    record.Thumbnail ||
    record.thumbnail ||
    record.realThumb ||
    record.imageUrl ||
    record.image ||
    recordContent?.imageUrl ||
    "";
  const imageUrl = typeof rawImage === "string" ? rawImage.trim() : undefined;

  if (!url && !textContent && !title && !notes) return null;

  return {
    title,
    content: url
      ? { type: BookmarkTypes.LINK, url }
      : { type: BookmarkTypes.TEXT, text: textContent || notes || title },
    description,
    notes,
    tags,
    lists,
    addDate,
    archived,
    favourited,
    imageUrl,
    paths: [],
  };
}

export function parseUniversalExcelBuffer(
  buffer: ArrayBuffer | Uint8Array,
): ParsedImportFile {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  } catch (e) {
    throw new Error(
      `Failed to parse Excel file (.xlsx/.xls): ${(e as Error).message}`,
    );
  }

  const allBookmarks: ParsedBookmark[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
    for (const record of records) {
      const bookmark = extractUniversalRecord(record);
      if (bookmark) {
        allBookmarks.push(bookmark);
      }
    }
  }

  return { bookmarks: allBookmarks, lists: [] };
}

function parseUniversalCsvFile(textContent: string): ParsedBookmark[] {
  let records: Record<string, unknown>[];
  try {
    records = parse(textContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch {
    // Fallback: try parsing with XLSX
    try {
      const workbook = XLSX.read(textContent, { type: "string" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      records = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: "",
      });
    } catch (fallbackErr) {
      throw new Error(
        `Failed to parse CSV file: ${(fallbackErr as Error).message}`,
      );
    }
  }

  const bookmarks: ParsedBookmark[] = [];
  for (const record of records) {
    const bookmark = extractUniversalRecord(record);
    if (bookmark) bookmarks.push(bookmark);
  }

  return bookmarks;
}

function parseUniversalJsonFile(textContent: string): ParsedBookmark[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(textContent);
  } catch {
    throw new Error("Invalid JSON file format.");
  }

  const records: Record<string, unknown>[] = Array.isArray(parsed)
    ? (parsed as Record<string, unknown>[])
    : typeof parsed === "object" && parsed !== null
      ? Array.isArray((parsed as Record<string, unknown>).bookmarks)
        ? ((parsed as Record<string, unknown>).bookmarks as Record<
            string,
            unknown
          >[])
        : Array.isArray((parsed as Record<string, unknown>).records)
          ? ((parsed as Record<string, unknown>).records as Record<
              string,
              unknown
            >[])
          : [parsed as Record<string, unknown>]
      : [];

  const bookmarks: ParsedBookmark[] = [];
  for (const record of records) {
    const bookmark = extractUniversalRecord(record);
    if (bookmark) bookmarks.push(bookmark);
  }

  return bookmarks;
}

export function parseImportFile(
  source: ImportSource,
  textContent: string,
): ParsedImportFile {
  if (source === "karakeep") {
    const parsed = parseKarakeepBookmarkFile(textContent);
    return parsed;
  }

  let result: ParsedBookmark[];
  switch (source) {
    case "csv":
      result = parseUniversalCsvFile(textContent);
      return { bookmarks: result, lists: [] };
    case "excel":
      try {
        const workbook = XLSX.read(textContent, { type: "string" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          firstSheet,
          { defval: "" },
        );
        result = records
          .map(extractUniversalRecord)
          .filter((b): b is ParsedBookmark => b !== null);
      } catch {
        result = parseUniversalCsvFile(textContent);
      }
      return { bookmarks: result, lists: [] };
    case "json":
      try {
        const parsed = parseKarakeepBookmarkFile(textContent);
        return parsed;
      } catch {
        result = parseUniversalJsonFile(textContent);
        return { bookmarks: result, lists: [] };
      }
    case "html":
      result = parseNetscapeBookmarkFile(textContent);
      break;
    case "pocket":
      result = parsePocketBookmarkFile(textContent);
      break;
    case "matter":
      result = parseMatterBookmarkFile(textContent);
      break;
    case "omnivore":
      result = parseOmnivoreBookmarkFile(textContent);
      break;
    case "linkwarden":
      result = parseLinkwardenBookmarkFile(textContent);
      break;
    case "tab-session-manager":
      result = parseTabSessionManagerStateFile(textContent);
      break;
    case "mymind":
      result = parseMymindBookmarkFile(textContent);
      break;
    case "instapaper":
      result = parseInstapaperBookmarkFile(textContent);
      break;
    case "readwise-reader":
      result = parseReadwiseReaderBookmarkFile(textContent);
      break;
    case "onetab":
      result = parseOneTabFile(textContent);
      break;
    default:
      result = parseUniversalJsonFile(textContent);
      return { bookmarks: result, lists: [] };
  }
  return { bookmarks: deduplicateBookmarks(result), lists: [] };
}
