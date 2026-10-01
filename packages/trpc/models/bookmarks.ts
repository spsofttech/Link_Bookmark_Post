import { createHash } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, lt, lte, or, SQL } from "drizzle-orm";
import TurndownService from "turndown";
import { z } from "zod";

import { db as DONT_USE_db } from "@karakeep/db";
import {
  assets,
  AssetTypes,
  bookmarkAssets,
  bookmarkLinks,
  bookmarks,
  bookmarksInLists,
  bookmarkTags,
  bookmarkTexts,
  rssFeedImportsTable,
  tagsOnBookmarks,
} from "@karakeep/db/schema";
import {
  deleteAsset,
  EmbeddingsQueue,
  readAsset,
  SearchIndexingQueue,
} from "@karakeep/shared-server";

import { WebhooksService } from "./webhooks.service";
import { getAlignedExpiry } from "@karakeep/shared/signedTokens";
import {
  BookmarkTypes,
  DEFAULT_NUM_BOOKMARKS_PER_PAGE,
  zGetBookmarksRequestSchema,
} from "@karakeep/shared/types/bookmarks";
import type {
  ZBareBookmark,
  ZBookmark,
  ZBookmarkContent,
  ZBookmarkReadableContent,
  ZBookmarkReadableContentFormat,
  ZPublicBookmark,
} from "@karakeep/shared/types/bookmarks";
import type { ZCursor } from "@karakeep/shared/types/pagination";
import {
  getBookmarkLinkAssetIdOrUrl,
  getBookmarkTitle,
} from "@karakeep/shared/utils/bookmarkUtils";
import { htmlToPlainText } from "@karakeep/shared/utils/htmlUtils";

import { AuthedContext } from "..";
import { mapDBAssetTypeToUserType } from "../lib/attachments";
import { getPreferredLinkPreview } from "../lib/linkPreview";
import { buildInArrayCondition } from "../lib/search";
import type { ZBookmarkTags } from "@karakeep/shared/types/tags";
import { Asset } from "./assets";
import { List } from "./lists";

async function dummyDrizzleReturnType() {
  const x = await DONT_USE_db.query.bookmarks.findFirst({
    with: {
      tagsOnBookmarks: {
        with: {
          tag: true,
        },
      },
      link: true,
      text: true,
      asset: true,
      assets: true,
    },
  });
  if (!x) {
    throw new Error();
  }
  return x;
}

type BookmarkQueryReturnType = Awaited<
  ReturnType<typeof dummyDrizzleReturnType>
>;

const turndownService = new TurndownService({
  bulletListMarker: "-",
  headingStyle: "atx",
});

export class BareBookmark {
  protected constructor(
    protected ctx: AuthedContext,
    private bareBookmark: ZBareBookmark,
  ) {}

  get id() {
    return this.bareBookmark.id;
  }

  get createdAt() {
    return this.bareBookmark.createdAt;
  }

  get userId() {
    return this.bareBookmark.userId;
  }

  static async bareFromId(ctx: AuthedContext, bookmarkId: string) {
    const bookmark = await ctx.db.query.bookmarks.findFirst({
      where: eq(bookmarks.id, bookmarkId),
    });

    if (!bookmark) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Bookmark not found",
      });
    }

    if (!(await BareBookmark.isAllowedToAccessBookmark(ctx, bookmark))) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Bookmark not found",
      });
    }

    return new BareBookmark(ctx, bookmark);
  }

  protected static async isAllowedToAccessBookmark(
    ctx: AuthedContext,
    { id: bookmarkId, userId: bookmarkOwnerId }: { id: string; userId: string },
  ): Promise<boolean> {
    if (bookmarkOwnerId == ctx.user.id) {
      return true;
    }
    const bookmarkLists = await List.forBookmark(ctx, bookmarkId);
    return bookmarkLists.some((l) => l.canUserView());
  }

  ensureOwnership() {
    if (this.bareBookmark.userId != this.ctx.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User is not allowed to access resource",
      });
    }
  }
}

export class Bookmark extends BareBookmark {
  protected constructor(
    ctx: AuthedContext,
    private bookmark: ZBookmark,
  ) {
    super(ctx, bookmark);
  }

  private static async toZodSchema(
    bookmark: BookmarkQueryReturnType,
    includeContent: boolean,
  ): Promise<ZBookmark> {
    const { tagsOnBookmarks, link, text, asset, assets, ...rest } = bookmark;

    let content: ZBookmarkContent = {
      type: BookmarkTypes.UNKNOWN,
    };
    if (bookmark.link) {
      content = {
        type: BookmarkTypes.LINK,
        screenshotAssetId: assets.find(
          (a) => a.assetType == AssetTypes.LINK_SCREENSHOT,
        )?.id,
        pdfAssetId: assets.find((a) => a.assetType == AssetTypes.LINK_PDF)?.id,
        fullPageArchiveAssetId: assets.find(
          (a) => a.assetType == AssetTypes.LINK_FULL_PAGE_ARCHIVE,
        )?.id,
        precrawledArchiveAssetId: assets.find(
          (a) => a.assetType == AssetTypes.LINK_PRECRAWLED_ARCHIVE,
        )?.id,
        imageAssetId: assets.find(
          (a) => a.assetType == AssetTypes.LINK_BANNER_IMAGE,
        )?.id,
        videoAssetId: assets.find((a) => a.assetType == AssetTypes.LINK_VIDEO)
          ?.id,
        url: link.url,
        title: link.title,
        description: link.description,
        imageUrl: link.imageUrl,
        favicon: link.favicon,
        htmlContent: includeContent
          ? await Bookmark.getBookmarkHtmlContent(link, bookmark.userId)
          : null,
        readerViewStatus: link.readerViewStatus,
        readerViewScore: link.readerViewScore,
        preferredPreview: getPreferredLinkPreview({
          readerViewStatus: link.readerViewStatus,
          readerViewReasons: link.readerViewReasons,
          crawlStatusCode: link.crawlStatusCode,
          hasScreenshot: assets.some(
            (asset) => asset.assetType === AssetTypes.LINK_SCREENSHOT,
          ),
        }),
        crawledAt: link.crawledAt,
        crawlStatus: link.crawlStatus,
        author: link.author,
        publisher: link.publisher,
        datePublished: link.datePublished,
        dateModified: link.dateModified,
      };
    }
    if (bookmark.text) {
      content = {
        type: BookmarkTypes.TEXT,
        // It's ok to include the text content as it's usually not big and is used to render the text bookmark card.
        text: text.text ?? "",
        sourceUrl: text.sourceUrl,
      };
    }
    if (bookmark.asset) {
      content = {
        type: BookmarkTypes.ASSET,
        assetType: asset.assetType,
        assetId: asset.assetId,
        fileName: asset.fileName,
        sourceUrl: asset.sourceUrl,
        size: assets.find((a) => a.id == asset.assetId)?.size,
        content: includeContent ? asset.content : null,
      };
    }
    if (content.type === BookmarkTypes.UNKNOWN) {
      const URL_REGEX = /(https?:\/\/[^\s"'<>)]+)/i;
      const foundUrl =
        bookmark.note?.match(URL_REGEX)?.[1] ||
        bookmark.title?.match(URL_REGEX)?.[1];
      if (foundUrl) {
        const cleanUrl = foundUrl.trim().replace(/[.,;:]+$/, "");
        content = {
          type: BookmarkTypes.LINK,
          url: cleanUrl,
          title: bookmark.title || cleanUrl,
          description: bookmark.note || "",
          imageUrl: null,
          favicon: null,
          htmlContent: null,
          readerViewStatus: null,
          readerViewScore: null,
          preferredPreview: null,
          crawledAt: null,
          crawlStatus: "pending",
          author: null,
          publisher: null,
          datePublished: null,
          dateModified: null,
        };
      } else if (bookmark.note || bookmark.title) {
        content = {
          type: BookmarkTypes.TEXT,
          text: bookmark.note || bookmark.title || "",
          sourceUrl: null,
        };
      }
    }

    return {
      tags: tagsOnBookmarks
        .map((t) => ({
          attachedBy: t.attachedBy,
          ...t.tag,
        }))
        .sort((a, b) =>
          a.attachedBy === "ai" ? 1 : b.attachedBy === "ai" ? -1 : 0,
        ),
      content,
      assets: assets.map((a) => ({
        id: a.id,
        assetType: mapDBAssetTypeToUserType(a.assetType),
        fileName: a.fileName,
      })),
      firstCreatedAt: bookmark.dbCreatedAt,
      ...rest,
    };
  }

  static async fromId(
    ctx: AuthedContext,
    bookmarkId: string,
    includeContent: boolean,
  ) {
    const bookmark = await ctx.db.query.bookmarks.findFirst({
      where: eq(bookmarks.id, bookmarkId),
      with: {
        tagsOnBookmarks: {
          with: {
            tag: true,
          },
        },
        link: true,
        text: true,
        asset: true,
        assets: true,
      },
    });

    if (!bookmark) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Bookmark not found",
      });
    }

    if (!(await BareBookmark.isAllowedToAccessBookmark(ctx, bookmark))) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Bookmark not found",
      });
    }
    return Bookmark.fromData(
      ctx,
      await Bookmark.toZodSchema(bookmark, includeContent),
    );
  }

  static fromData(ctx: AuthedContext, data: ZBookmark) {
    return new Bookmark(ctx, data);
  }

  static async buildDebugInfo(ctx: AuthedContext, bookmarkId: string) {
    // Verify the user is an admin
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const PRIVACY_REDACTED_ASSET_TYPES = new Set<AssetTypes>([
      AssetTypes.USER_UPLOADED,
      AssetTypes.BOOKMARK_ASSET,
    ]);

    const bookmark = await ctx.db.query.bookmarks.findFirst({
      where: eq(bookmarks.id, bookmarkId),
      with: {
        link: true,
        text: true,
        asset: true,
        tagsOnBookmarks: {
          with: {
            tag: true,
          },
        },
        assets: true,
      },
    });

    if (!bookmark) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Bookmark not found",
      });
    }

    // Build link info
    let linkInfo = null;
    if (bookmark.link) {
      const htmlContentPreview = await (async () => {
        try {
          const content = await Bookmark.getBookmarkHtmlContent(
            bookmark.link!,
            bookmark.userId,
          );
          return content ? content.substring(0, 1000) : null;
        } catch {
          return null;
        }
      })();

      linkInfo = {
        url: bookmark.link.url,
        crawlStatus: bookmark.link.crawlStatus ?? "pending",
        crawlStatusCode: bookmark.link.crawlStatusCode,
        crawledAt: bookmark.link.crawledAt,
        hasHtmlContent: !!bookmark.link.htmlContent,
        hasContentAsset: !!bookmark.link.contentAssetId,
        htmlContentPreview,
      };
    }

    // Build text info
    let textInfo = null;
    if (bookmark.text) {
      textInfo = {
        hasText: !!bookmark.text.text,
        sourceUrl: bookmark.text.sourceUrl,
      };
    }

    // Build asset info
    let assetInfo = null;
    if (bookmark.asset) {
      assetInfo = {
        assetType: bookmark.asset.assetType,
        hasContent: !!bookmark.asset.content,
        fileName: bookmark.asset.fileName,
      };
    }

    // Build tags
    const tags = bookmark.tagsOnBookmarks.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
      attachedBy: t.attachedBy,
    }));

    // Build assets list with signed URLs (exclude userUploaded)
    const assetsWithUrls = bookmark.assets.map((a) => {
      // Generate signed token with 10 mins expiry
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
      // Exclude userUploaded assets for privacy reasons
      const url = !PRIVACY_REDACTED_ASSET_TYPES.has(a.assetType)
        ? Asset.getPublicSignedAssetUrl(a.id, bookmark.userId, expiresAt)
        : null;

      return {
        id: a.id,
        assetType: a.assetType,
        size: a.size,
        url,
      };
    });

    return {
      id: bookmark.id,
      type: bookmark.type,
      source: bookmark.source,
      firstCreatedAt: bookmark.dbCreatedAt,
      createdAt: bookmark.createdAt,
      modifiedAt: bookmark.modifiedAt,
      title: bookmark.title,
      summary: bookmark.summary,
      taggingStatus: bookmark.taggingStatus,
      summarizationStatus: bookmark.summarizationStatus,
      embeddingStatus: bookmark.embeddingStatus,
      userId: bookmark.userId,
      linkInfo,
      textInfo,
      assetInfo,
      tags,
      assets: assetsWithUrls,
    };
  }

  static async loadMulti(
    ctx: AuthedContext,
    // `ids` is intentionally not part of the public getBookmarks API; it's
    // only settable by server-side callers (search, smart lists, public lists).
    input: z.infer<typeof zGetBookmarksRequestSchema> & { ids?: string[] },
  ): Promise<{
    bookmarks: Bookmark[];
    nextCursor: ZCursor | null;
  }> {
    if (input.ids && input.ids.length == 0) {
      return { bookmarks: [], nextCursor: null };
    }
    if (!input.limit) {
      // When loading by ids, callers expect all requested bookmarks back,
      // not a single default-sized page.
      input.limit = input.ids
        ? input.ids.length
        : DEFAULT_NUM_BOOKMARKS_PER_PAGE;
    }

    // Validate that only one of listId, tagId, or rssFeedId is specified
    // Combined filters are not supported as they would require different query strategies
    const filterCount = [input.listId, input.tagId, input.rssFeedId].filter(
      (f) => f !== undefined,
    ).length;
    if (filterCount > 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Cannot filter by multiple of listId, tagId, and rssFeedId simultaneously",
      });
    }

    // Handle smart lists by converting to bookmark IDs
    if (input.listId) {
      const list = await List.fromId(ctx, input.listId);
      if (list.type === "smart") {
        input.ids = await list.getBookmarkIds();
        delete input.listId;
      }
    }

    // Build cursor condition for pagination
    const buildCursorCondition = (
      createdAtCol: typeof bookmarks.createdAt,
      idCol: typeof bookmarks.id,
    ): SQL | undefined => {
      if (!input.cursor) return undefined;

      if (input.sortOrder === "asc") {
        return or(
          gt(createdAtCol, input.cursor.createdAt),
          and(
            eq(createdAtCol, input.cursor.createdAt),
            lte(idCol, input.cursor.id),
          ),
        );
      }
      return or(
        lt(createdAtCol, input.cursor.createdAt),
        and(
          eq(createdAtCol, input.cursor.createdAt),
          lte(idCol, input.cursor.id),
        ),
      );
    };

    // Build common filter conditions (archived, favourited, ids)
    const buildCommonFilters = (): (SQL | undefined)[] => [
      input.archived !== undefined
        ? eq(bookmarks.archived, input.archived)
        : undefined,
      input.favourited !== undefined
        ? eq(bookmarks.favourited, input.favourited)
        : undefined,
      input.ids ? buildInArrayCondition(bookmarks.id, input.ids) : undefined,
    ];

    // Build ORDER BY clause
    const buildOrderBy = () =>
      [
        input.sortOrder === "asc"
          ? asc(bookmarks.createdAt)
          : desc(bookmarks.createdAt),
        desc(bookmarks.id),
      ] as const;

    const projection = {
      bookmark: bookmarks,
      bookmarkLinks: bookmarkLinks,
      bookmarkTexts: bookmarkTexts,
      bookmarkAssets: bookmarkAssets,
    };

    let results: {
      bookmark: typeof bookmarks.$inferSelect;
      bookmarkLinks: typeof bookmarkLinks.$inferSelect | null;
      bookmarkTexts: typeof bookmarkTexts.$inferSelect | null;
      bookmarkAssets: typeof bookmarkAssets.$inferSelect | null;
    }[];

    if (input.listId !== undefined) {
      results = await ctx.db
        .select(projection)
        .from(bookmarksInLists)
        .innerJoin(bookmarks, eq(bookmarks.id, bookmarksInLists.bookmarkId))
        .leftJoin(bookmarkLinks, eq(bookmarkLinks.id, bookmarks.id))
        .leftJoin(bookmarkTexts, eq(bookmarkTexts.id, bookmarks.id))
        .leftJoin(bookmarkAssets, eq(bookmarkAssets.id, bookmarks.id))
        .where(
          and(
            eq(bookmarksInLists.listId, input.listId),
            ...buildCommonFilters(),
            buildCursorCondition(bookmarks.createdAt, bookmarks.id),
          ),
        )
        .limit(input.limit + 1)
        .orderBy(...buildOrderBy());
    } else if (input.tagId !== undefined) {
      results = await ctx.db
        .select(projection)
        .from(tagsOnBookmarks)
        .innerJoin(bookmarks, eq(bookmarks.id, tagsOnBookmarks.bookmarkId))
        .leftJoin(bookmarkLinks, eq(bookmarkLinks.id, bookmarks.id))
        .leftJoin(bookmarkTexts, eq(bookmarkTexts.id, bookmarks.id))
        .leftJoin(bookmarkAssets, eq(bookmarkAssets.id, bookmarks.id))
        .where(
          and(
            eq(tagsOnBookmarks.tagId, input.tagId),
            eq(bookmarks.userId, ctx.user.id),
            ...buildCommonFilters(),
            buildCursorCondition(bookmarks.createdAt, bookmarks.id),
          ),
        )
        .limit(input.limit + 1)
        .orderBy(...buildOrderBy());
    } else if (input.rssFeedId !== undefined) {
      results = await ctx.db
        .select(projection)
        .from(rssFeedImportsTable)
        .innerJoin(bookmarks, eq(bookmarks.id, rssFeedImportsTable.bookmarkId))
        .leftJoin(bookmarkLinks, eq(bookmarkLinks.id, bookmarks.id))
        .leftJoin(bookmarkTexts, eq(bookmarkTexts.id, bookmarks.id))
        .leftJoin(bookmarkAssets, eq(bookmarkAssets.id, bookmarks.id))
        .where(
          and(
            eq(rssFeedImportsTable.rssFeedId, input.rssFeedId),
            eq(bookmarks.userId, ctx.user.id),
            ...buildCommonFilters(),
            buildCursorCondition(bookmarks.createdAt, bookmarks.id),
          ),
        )
        .limit(input.limit + 1)
        .orderBy(...buildOrderBy());
    } else {
      results = await ctx.db
        .select(projection)
        .from(bookmarks)
        .leftJoin(bookmarkLinks, eq(bookmarkLinks.id, bookmarks.id))
        .leftJoin(bookmarkTexts, eq(bookmarkTexts.id, bookmarks.id))
        .leftJoin(bookmarkAssets, eq(bookmarkAssets.id, bookmarks.id))
        .where(
          and(
            eq(bookmarks.userId, ctx.user.id),
            ...buildCommonFilters(),
            buildCursorCondition(bookmarks.createdAt, bookmarks.id),
          ),
        )
        .limit(input.limit + 1)
        .orderBy(...buildOrderBy());
    }

    const baseBookmarksMap = new Map<
      string,
      {
        bookmark: typeof bookmarks.$inferSelect;
        link: typeof bookmarkLinks.$inferSelect | null;
        text: typeof bookmarkTexts.$inferSelect | null;
        asset: typeof bookmarkAssets.$inferSelect | null;
      }
    >();

    for (const row of results) {
      const b = row.bookmark;
      const bId = b.id;
      if (!baseBookmarksMap.has(bId)) {
        if (row.bookmarkLinks && !input.includeContent) {
          row.bookmarkLinks.htmlContent = null;
        }
        baseBookmarksMap.set(bId, {
          bookmark: b,
          link: row.bookmarkLinks?.id ? row.bookmarkLinks : null,
          text: row.bookmarkTexts?.id ? row.bookmarkTexts : null,
          asset: row.bookmarkAssets?.id ? row.bookmarkAssets : null,
        });
      }
    }

    const pageBookmarkItems = Array.from(baseBookmarksMap.values());
    const pageBookmarkIds = pageBookmarkItems.map((item) => item.bookmark.id);

    // Batch fetch tags and assets for the page's bookmarks in 2 quick indexed queries
    const tagsMap = new Map<string, ZBookmarkTags[]>();
    const assetsMap = new Map<
      string,
      {
        id: string;
        assetType: AssetTypes;
        fileName: string | null;
        size: number | null;
      }[]
    >();

    if (pageBookmarkIds.length > 0) {
      const tagCondition = buildInArrayCondition(
        tagsOnBookmarks.bookmarkId,
        pageBookmarkIds,
      );
      const assetCondition = buildInArrayCondition(
        assets.bookmarkId,
        pageBookmarkIds,
      );

      const [tagsResult, assetsResult] = await Promise.all([
        tagCondition
          ? ctx.db
              .select({
                bookmarkId: tagsOnBookmarks.bookmarkId,
                attachedBy: tagsOnBookmarks.attachedBy,
                tag: bookmarkTags,
              })
              .from(tagsOnBookmarks)
              .innerJoin(
                bookmarkTags,
                eq(tagsOnBookmarks.tagId, bookmarkTags.id),
              )
              .where(tagCondition)
          : Promise.resolve([]),
        assetCondition
          ? ctx.db
              .select({
                id: assets.id,
                bookmarkId: assets.bookmarkId,
                assetType: assets.assetType,
                fileName: assets.fileName,
                size: assets.size,
              })
              .from(assets)
              .where(assetCondition)
          : Promise.resolve([]),
      ]);

      for (const row of tagsResult) {
        if (!tagsMap.has(row.bookmarkId)) {
          tagsMap.set(row.bookmarkId, []);
        }
        tagsMap.get(row.bookmarkId)!.push({
          ...row.tag,
          attachedBy: row.attachedBy,
        });
      }

      for (const row of assetsResult) {
        if (row.bookmarkId) {
          if (!assetsMap.has(row.bookmarkId)) {
            assetsMap.set(row.bookmarkId, []);
          }
          assetsMap.get(row.bookmarkId)!.push(row);
        }
      }
    }

    const bookmarksRes: Record<string, ZBookmark> = {};

    for (const item of pageBookmarkItems) {
      const b = item.bookmark;
      const bId = b.id;
      const bTags = tagsMap.get(bId) ?? [];
      const bAssets = assetsMap.get(bId) ?? [];

      let content: ZBookmarkContent;
      if (item.link) {
        const link = item.link;
        content = {
          type: BookmarkTypes.LINK,
          url: link.url,
          title: link.title,
          description: link.description,
          imageUrl: link.imageUrl,
          favicon: link.favicon,
          htmlContent: input.includeContent ? link.htmlContent : null,
          contentAssetId: link.contentAssetId,
          readerViewStatus: link.readerViewStatus,
          readerViewScore: link.readerViewScore,
          screenshotAssetId: bAssets.find(
            (a) => a.assetType === AssetTypes.LINK_SCREENSHOT,
          )?.id,
          pdfAssetId: bAssets.find((a) => a.assetType === AssetTypes.LINK_PDF)
            ?.id,
          fullPageArchiveAssetId: bAssets.find(
            (a) => a.assetType === AssetTypes.LINK_FULL_PAGE_ARCHIVE,
          )?.id,
          precrawledArchiveAssetId: bAssets.find(
            (a) => a.assetType === AssetTypes.LINK_PRECRAWLED_ARCHIVE,
          )?.id,
          imageAssetId: bAssets.find(
            (a) => a.assetType === AssetTypes.LINK_BANNER_IMAGE,
          )?.id,
          videoAssetId: bAssets.find(
            (a) => a.assetType === AssetTypes.LINK_VIDEO,
          )?.id,
          preferredPreview: getPreferredLinkPreview({
            readerViewStatus: link.readerViewStatus,
            readerViewReasons: link.readerViewReasons,
            crawlStatusCode: link.crawlStatusCode,
            hasScreenshot: bAssets.some(
              (a) => a.assetType === AssetTypes.LINK_SCREENSHOT,
            ),
          }),
          crawlStatus: link.crawlStatus,
          crawledAt: link.crawledAt,
          author: link.author,
          publisher: link.publisher,
          datePublished: link.datePublished,
          dateModified: link.dateModified,
        };
      } else if (item.text) {
        content = {
          type: BookmarkTypes.TEXT,
          text: item.text.text ?? "",
          sourceUrl: item.text.sourceUrl ?? null,
        };
      } else if (item.asset) {
        const mainAsset = bAssets.find((a) => a.id === item.asset!.assetId);
        content = {
          type: BookmarkTypes.ASSET,
          assetId: item.asset.assetId,
          assetType: item.asset.assetType,
          fileName: item.asset.fileName,
          sourceUrl: item.asset.sourceUrl ?? null,
          size: mainAsset?.size ?? null,
          content: input.includeContent ? (item.asset.content ?? null) : null,
        };
      } else {
        const URL_REGEX = /(https?:\/\/[^\s"'<>)]+)/i;
        const foundUrl =
          b.note?.match(URL_REGEX)?.[1] || b.title?.match(URL_REGEX)?.[1];
        if (foundUrl) {
          const cleanUrl = foundUrl.trim().replace(/[.,;:]+$/, "");
          content = {
            type: BookmarkTypes.LINK,
            url: cleanUrl,
            title: b.title || cleanUrl,
            description: b.note || "",
            imageUrl: null,
            favicon: null,
            htmlContent: null,
            readerViewStatus: null,
            readerViewScore: null,
            preferredPreview: null,
            crawledAt: null,
            crawlStatus: "pending",
            author: null,
            publisher: null,
            datePublished: null,
            dateModified: null,
          };
        } else {
          content = {
            type: BookmarkTypes.TEXT,
            text: b.note || b.title || "",
            sourceUrl: null,
          };
        }
      }

      bookmarksRes[bId] = {
        ...b,
        firstCreatedAt: b.dbCreatedAt,
        content,
        tags: bTags.sort((a, b) =>
          a.attachedBy === "ai" ? 1 : b.attachedBy === "ai" ? -1 : 0,
        ),
        assets: bAssets.map((a) => ({
          id: a.id,
          assetType: mapDBAssetTypeToUserType(a.assetType),
          fileName: a.fileName,
        })),
      };
    }

    const bookmarksArr = Object.values(bookmarksRes);

    // Fetch HTML content from assets for bookmarks that have contentAssetId (large content)
    if (input.includeContent) {
      await Promise.all(
        bookmarksArr.map(async (bookmark) => {
          if (
            bookmark.content.type === BookmarkTypes.LINK &&
            bookmark.content.contentAssetId &&
            !bookmark.content.htmlContent // Only fetch if not already inline
          ) {
            try {
              const asset = await readAsset({
                userId: bookmark.userId,
                assetId: bookmark.content.contentAssetId,
              });
              bookmark.content.htmlContent = asset.asset.toString("utf8");
            } catch (error) {
              // If asset reading fails, keep htmlContent as null
              console.warn(
                `Failed to read HTML content asset ${bookmark.content.contentAssetId}:`,
                error,
              );
            }
          }
        }),
      );
    }

    bookmarksArr.sort((a, b) => {
      if (a.createdAt != b.createdAt) {
        return input.sortOrder === "asc"
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime();
      } else {
        return b.id.localeCompare(a.id);
      }
    });

    bookmarksArr.forEach((b) => {
      b.tags.sort((a, b) =>
        a.attachedBy === "ai" ? 1 : b.attachedBy === "ai" ? -1 : 0,
      );
    });

    let nextCursor = null;
    if (bookmarksArr.length > input.limit) {
      const nextItem = bookmarksArr.pop()!;
      nextCursor = {
        id: nextItem.id,
        createdAt: nextItem.createdAt,
      };
    }

    return {
      bookmarks: bookmarksArr.map((b) => Bookmark.fromData(ctx, b)),
      nextCursor,
    };
  }

  asZBookmark(): ZBookmark {
    if (this.bookmark.userId === this.ctx.user.id) {
      return this.bookmark;
    }

    // Collaborators shouldn't see owner-specific state such as favourites,
    // archived flag, or personal notes.
    return {
      ...this.bookmark,
      archived: false,
      favourited: false,
      note: null,
    };
  }

  asReadableContent(
    format: ZBookmarkReadableContentFormat,
  ): ZBookmarkReadableContent {
    let content: string;
    switch (this.bookmark.content.type) {
      case BookmarkTypes.LINK: {
        const htmlContent = this.bookmark.content.htmlContent ?? "";
        content =
          format === "markdown"
            ? turndownService.turndown(htmlContent)
            : htmlToPlainText(htmlContent);
        break;
      }
      case BookmarkTypes.TEXT:
        content = this.bookmark.content.text;
        break;
      case BookmarkTypes.ASSET:
        content = this.bookmark.content.content ?? "";
        break;
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Bookmark has an unknown content type",
        });
    }

    content = content.replace(/\r\n?/g, "\n").trim();
    const contentVersion = `sha256:${createHash("sha256")
      .update(format)
      .update("\0")
      .update(content)
      .digest("hex")}`;

    return {
      bookmarkId: this.bookmark.id,
      bookmarkType: this.bookmark.content.type,
      format,
      content,
      contentVersion,
    };
  }

  asPublicBookmark(): ZPublicBookmark {
    const getPublicSignedAssetUrl = (assetId: string) => {
      // Tokens will expire in 1 hour and will have a grace period of 15mins
      return Asset.getPublicSignedAssetUrl(
        assetId,
        this.bookmark.userId,
        getAlignedExpiry(3600, 900),
      );
    };
    const getContent = (
      content: ZBookmarkContent,
    ): ZPublicBookmark["content"] => {
      switch (content.type) {
        case BookmarkTypes.LINK: {
          return {
            type: BookmarkTypes.LINK,
            url: content.url,
          };
        }
        case BookmarkTypes.TEXT: {
          return {
            type: BookmarkTypes.TEXT,
            text: content.text,
          };
        }
        case BookmarkTypes.ASSET: {
          return {
            type: BookmarkTypes.ASSET,
            assetType: content.assetType,
            assetId: content.assetId,
            assetUrl: getPublicSignedAssetUrl(content.assetId),
            fileName: content.fileName,
            sourceUrl: content.sourceUrl,
          };
        }
        default: {
          throw new Error("Unknown bookmark content type");
        }
      }
    };

    const getBannerImageUrl = (content: ZBookmarkContent): string | null => {
      switch (content.type) {
        case BookmarkTypes.LINK: {
          const assetIdOrUrl = getBookmarkLinkAssetIdOrUrl(content);
          if (!assetIdOrUrl) {
            return null;
          }
          if (assetIdOrUrl.localAsset) {
            return getPublicSignedAssetUrl(assetIdOrUrl.assetId);
          } else {
            return assetIdOrUrl.url;
          }
        }
        case BookmarkTypes.TEXT: {
          return null;
        }
        case BookmarkTypes.ASSET: {
          switch (content.assetType) {
            case "image":
              return `${getPublicSignedAssetUrl(content.assetId)}`;
            case "pdf": {
              const screenshotAssetId = this.bookmark.assets.find(
                (r) => r.assetType === "assetScreenshot",
              )?.id;
              if (!screenshotAssetId) {
                return null;
              }
              return getPublicSignedAssetUrl(screenshotAssetId);
            }
            default: {
              const _exhaustiveCheck: never = content.assetType;
              return null;
            }
          }
        }
        default: {
          throw new Error("Unknown bookmark content type");
        }
      }
    };

    // WARNING: Everything below is exposed in the public APIs, don't use spreads!
    return {
      id: this.bookmark.id,
      createdAt: this.bookmark.createdAt,
      modifiedAt: this.bookmark.modifiedAt,
      title: getBookmarkTitle(this.bookmark),
      tags: this.bookmark.tags.map((t) => t.name),
      content: getContent(this.bookmark.content),
      bannerImageUrl: getBannerImageUrl(this.bookmark.content),
    };
  }

  static async getBookmarkHtmlContent(
    {
      contentAssetId,
      htmlContent,
    }: {
      contentAssetId: string | null;
      htmlContent: string | null;
    },
    userId: string,
  ): Promise<string | null> {
    if (contentAssetId) {
      // Read large HTML content from asset
      const asset = await readAsset({
        userId,
        assetId: contentAssetId,
      });
      return asset.asset.toString("utf8");
    } else if (htmlContent) {
      return htmlContent;
    }
    return null;
  }

  static async getBookmarkPlainTextContent(
    {
      contentAssetId,
      htmlContent,
    }: {
      contentAssetId: string | null;
      htmlContent: string | null;
    },
    userId: string,
  ): Promise<string | null> {
    const content = await this.getBookmarkHtmlContent(
      {
        contentAssetId,
        htmlContent,
      },
      userId,
    );
    if (!content) {
      return null;
    }
    return htmlToPlainText(content);
  }

  private async cleanupAssets() {
    const assetIds: Set<string> = new Set<string>(
      this.bookmark.assets.map((a) => a.id),
    );
    // Todo: Remove when the bookmark asset is also in the assets table
    if (this.bookmark.content.type == BookmarkTypes.ASSET) {
      assetIds.add(this.bookmark.content.assetId);
    }
    await Promise.all(
      Array.from(assetIds).map((assetId) =>
        deleteAsset({ userId: this.bookmark.userId, assetId }),
      ),
    );
  }

  async delete() {
    this.ensureOwnership();
    const deleted = await this.ctx.db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, this.ctx.user.id),
          eq(bookmarks.id, this.bookmark.id),
        ),
      );

    await SearchIndexingQueue.enqueue(
      {
        bookmarkId: this.bookmark.id,
        type: "delete",
      },
      {
        groupId: this.ctx.user.id,
      },
    );
    await EmbeddingsQueue.enqueue(
      {
        bookmarkId: this.bookmark.id,
        type: "delete",
      },
      {
        groupId: this.ctx.user.id,
      },
    );

    const webhookService = new WebhooksService(this.ctx.db);
    await webhookService.triggerWebhook(
      this.bookmark.id,
      "deleted",
      this.bookmark.userId,
      {
        groupId: this.ctx.user.id,
      },
    );
    if ((deleted.rowCount ?? 0) > 0) {
      await this.cleanupAssets();
    }
  }
}
