import { NextRequest } from "next/server";
import {
  createContextFromRequest,
  createTrcpClientFromCtx,
} from "@/server/api/client";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@karakeep/db";
import {
  bookmarksInLists,
  bookmarks as bookmarksTable,
} from "@karakeep/db/schema";
import {
  toCsvFormat,
  toExcelFormat,
  toExportFormat,
  toExportListFormat,
  toNetscapeFormat,
  zExportSchema,
} from "@karakeep/shared/import-export";
import { MAX_NUM_BOOKMARKS_PER_PAGE } from "@karakeep/shared/types/bookmarks";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const ctx = await createContextFromRequest(request);
  if (!ctx.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "json";

  const req = {
    limit: MAX_NUM_BOOKMARKS_PER_PAGE,
    useCursorV2: true,
    includeContent: true,
  };

  const caller = createTrcpClientFromCtx(() => ctx);

  let resp = await caller.bookmarks.getBookmarks(req);
  let bookmarks = resp.bookmarks;

  while (resp.nextCursor) {
    resp = await caller.bookmarks.getBookmarks({
      ...req,
      cursor: resp.nextCursor,
    });
    bookmarks = [...bookmarks, ...resp.bookmarks];
  }

  // Fetch lists and bookmark-to-list memberships
  const listsResp = await caller.lists.list();
  const ownedLists = listsResp.lists.filter((l) => l.userRole === "owner");

  const manualLists = ownedLists.filter((l) => l.type === "manual");
  const manualListIds = manualLists.map((l) => l.id);
  const listIdToName = new Map(manualLists.map((l) => [l.id, l.name]));

  let memberships: { bookmarkId: string; listId: string }[] = [];
  if (manualListIds.length > 0) {
    memberships = await db
      .select({
        bookmarkId: bookmarksInLists.bookmarkId,
        listId: bookmarksInLists.listId,
      })
      .from(bookmarksInLists)
      .innerJoin(
        bookmarksTable,
        eq(bookmarksTable.id, bookmarksInLists.bookmarkId),
      )
      .where(
        and(
          inArray(bookmarksInLists.listId, manualListIds),
          eq(bookmarksTable.userId, ctx.user.id),
        ),
      );
  }

  const bookmarkListMap = new Map<string, string[]>();
  const bookmarkListNamesMap = new Map<string, string[]>();
  for (const m of memberships) {
    const existing = bookmarkListMap.get(m.bookmarkId) ?? [];
    existing.push(m.listId);
    bookmarkListMap.set(m.bookmarkId, existing);

    const name = listIdToName.get(m.listId);
    if (name) {
      const existingNames = bookmarkListNamesMap.get(m.bookmarkId) ?? [];
      existingNames.push(name);
      bookmarkListNamesMap.set(m.bookmarkId, existingNames);
    }
  }

  if (format === "json") {
    const exportData: z.infer<typeof zExportSchema> = {
      bookmarks: bookmarks.map((b) =>
        toExportFormat(b, bookmarkListMap.get(b.id) ?? []),
      ),
      lists: ownedLists.map(toExportListFormat),
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-type": "application/json",
        "Content-disposition": `attachment; filename="karakeep-export-${new Date().toISOString()}.json"`,
      },
    });
  } else if (format === "excel" || format === "xlsx") {
    const excelBuffer = toExcelFormat(bookmarks, bookmarkListNamesMap);
    const filename = `karakeep-export-${new Date().toISOString().split("T")[0]}.xlsx`;
    return new Response(Buffer.from(excelBuffer), {
      status: 200,
      headers: {
        "Content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-disposition": `attachment; filename="${filename}"`,
      },
    });
  } else if (format === "csv") {
    const csvContent = toCsvFormat(bookmarks, bookmarkListNamesMap);
    const filename = `karakeep-export-${new Date().toISOString().split("T")[0]}.csv`;
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-type": "text/csv; charset=utf-8",
        "Content-disposition": `attachment; filename="${filename}"`,
      },
    });
  } else if (format === "netscape") {
    // Netscape format
    const netscapeContent = toNetscapeFormat(bookmarks);

    return new Response(netscapeContent, {
      status: 200,
      headers: {
        "Content-type": "text/html",
        "Content-disposition": `attachment; filename="bookmarks-${new Date().toISOString()}.html"`,
      },
    });
  } else {
    return Response.json({ error: "Invalid format" }, { status: 400 });
  }
}
