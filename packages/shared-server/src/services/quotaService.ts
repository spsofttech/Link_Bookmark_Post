import { count, eq, sum } from "drizzle-orm";

import type { DB, KarakeepDBTransaction } from "@karakeep/db";
import { assets, bookmarks, users } from "@karakeep/db/schema";
import { QuotaApproved } from "@karakeep/shared/storageQuota";

export class StorageQuotaError extends Error {
  constructor(
    public readonly currentUsage: number,
    public readonly quota: number,
    public readonly requestedSize: number,
  ) {
    super(
      `Storage quota exceeded. Current usage: ${Math.round(currentUsage / 1024 / 1024)}MB, Quota: ${Math.round(quota / 1024 / 1024)}MB, Requested: ${Math.round(requestedSize / 1024 / 1024)}MB`,
    );
    this.name = "StorageQuotaError";
  }
}

export class QuotaService {
  static async canCreateBookmark(db: DB, userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        bookmarkQuota: true,
      },
    });

    if (user?.bookmarkQuota !== null && user?.bookmarkQuota !== undefined) {
      const currentBookmarkCount = await db
        .select({ count: count() })
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId));

      return this.bookmarkQuotaResult(
        user.bookmarkQuota,
        currentBookmarkCount[0].count,
      );
    }
    return {
      result: true,
    } as const;
  }

  static async canCreateBookmarkInTransaction(
    tx: KarakeepDBTransaction,
    userId: string,
  ) {
    const user = await tx.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        bookmarkQuota: true,
      },
    });

    if (user?.bookmarkQuota !== null && user?.bookmarkQuota !== undefined) {
      const currentBookmarkCount = await tx
        .select({ count: count() })
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId));

      return this.bookmarkQuotaResult(
        user.bookmarkQuota,
        currentBookmarkCount[0].count,
      );
    }
    return {
      result: true,
    } as const;
  }

  private static bookmarkQuotaResult(
    bookmarkQuota: number,
    currentBookmarkCount: number,
  ) {
    if (currentBookmarkCount >= bookmarkQuota) {
      return {
        result: false,
        error: `Bookmark quota exceeded. You can only have ${bookmarkQuota} bookmarks.`,
      } as const;
    }
    return {
      result: true,
    } as const;
  }

  static async checkStorageQuota(
    db: DB,
    userId: string,
    requestedSize: number,
  ): Promise<QuotaApproved> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        storageQuota: true,
      },
    });

    if (user?.storageQuota === null || user?.storageQuota === undefined) {
      return QuotaApproved._create(userId, requestedSize);
    }

    const currentUsage = await this.getCurrentStorageUsage(db, userId);

    if (currentUsage + requestedSize > user.storageQuota) {
      throw new StorageQuotaError(
        currentUsage,
        user.storageQuota,
        requestedSize,
      );
    }

    return QuotaApproved._create(userId, requestedSize);
  }

  static async getCurrentStorageUsage(db: DB, userId: string): Promise<number> {
    const currentUsageResult = await db
      .select({ totalSize: sum(assets.size) })
      .from(assets)
      .where(eq(assets.userId, userId));

    return Number(currentUsageResult[0]?.totalSize ?? 0);
  }
}
