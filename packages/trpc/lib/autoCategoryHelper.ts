import { and, eq } from "drizzle-orm";

import type { DB } from "@karakeep/db";
import {
  bookmarkLinks,
  bookmarks,
  bookmarkTags,
  tagsOnBookmarks,
} from "@karakeep/db/schema";
import { extractTitleAndDescription } from "@karakeep/shared/utils/metadataExtractor";

export async function processAndApplyAutoCategoryAndMetadata(
  db: DB,
  userId: string,
  bookmarkId: string,
  data: {
    url?: string | null;
    title?: string | null;
    description?: string | null;
    content?: string | null;
    note?: string | null;
    tags?: string[] | null;
  },
): Promise<{ title: string; description: string; category: string }> {
  const extracted = extractTitleAndDescription(data);
  const { title, description, category } = extracted;

  // 1. Update bookmark title if it was generic or missing
  if (data.title !== title && title) {
    try {
      await db
        .update(bookmarks)
        .set({ title })
        .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)));
    } catch {
      // ignore update errors
    }
  }

  // 2. Update link description if link bookmark
  if (data.url && description) {
    try {
      await db
        .update(bookmarkLinks)
        .set({ description })
        .where(eq(bookmarkLinks.id, bookmarkId));
    } catch {
      // ignore
    }
  }

  // 3. Ensure Category tag exists and attach to bookmark
  try {
    let tag = await db.query.bookmarkTags.findFirst({
      where: and(
        eq(bookmarkTags.userId, userId),
        eq(bookmarkTags.name, category),
      ),
    });

    if (!tag) {
      const [newTag] = await db
        .insert(bookmarkTags)
        .values({
          userId,
          name: category,
          normalizedName: category.toLowerCase().replace(/\s+/g, "-"),
        })
        .onConflictDoNothing()
        .returning();

      if (newTag) {
        tag = newTag;
      } else {
        tag = await db.query.bookmarkTags.findFirst({
          where: and(
            eq(bookmarkTags.userId, userId),
            eq(bookmarkTags.name, category),
          ),
        });
      }
    }

    if (tag) {
      await db
        .insert(tagsOnBookmarks)
        .values({
          bookmarkId,
          tagId: tag.id,
          attachedBy: "ai",
        })
        .onConflictDoNothing();
    }
  } catch {
    // ignore tag duplicate errors
  }

  return extracted;
}
