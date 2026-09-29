"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

import type { ZBookmarkTypeAsset } from "@karakeep/shared/types/bookmarks";
import { getAssetUrl } from "@karakeep/shared/utils/assetUtils";
import { getSourceUrl } from "@karakeep/shared/utils/bookmarkUtils";

import { BookmarkLayoutAdaptingCard } from "./BookmarkLayoutAdaptingCard";
import FooterLinkURL from "./FooterLinkURL";

function AssetImage({
  bookmark,
  className,
}: {
  bookmark: ZBookmarkTypeAsset;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const bookmarkedAsset = bookmark.content;
  switch (bookmarkedAsset.assetType) {
    case "image": {
      return (
        <Link
          href={`/dashboard/preview/${bookmark.id}`}
          className="relative block size-full overflow-hidden bg-muted"
        >
          {!loaded && (
            <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-r from-muted/60 via-muted-foreground/20 to-muted/60" />
          )}
          <Image
            alt="asset"
            src={getAssetUrl(bookmarkedAsset.assetId)}
            fill={true}
            unoptimized
            className={cn(
              className,
              "transition-opacity duration-300",
              !loaded && "opacity-0",
            )}
            onLoad={() => setLoaded(true)}
          />
        </Link>
      );
    }
    case "pdf": {
      const screenshotAssetId = bookmark.assets.find(
        (r) => r.assetType === "assetScreenshot",
      )?.id;
      if (!screenshotAssetId) {
        return (
          <div
            className={cn(className, "flex items-center justify-center")}
            title="PDF screenshot not available. Run asset preprocessing job to generate one screenshot"
          >
            <FileText size={80} />
          </div>
        );
      }
      return (
        <Link
          href={`/dashboard/preview/${bookmark.id}`}
          className="relative block size-full overflow-hidden bg-muted"
        >
          {!loaded && (
            <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-r from-muted/60 via-muted-foreground/20 to-muted/60" />
          )}
          <Image
            alt="asset"
            src={getAssetUrl(screenshotAssetId)}
            fill={true}
            unoptimized
            className={cn(
              className,
              "transition-opacity duration-300",
              !loaded && "opacity-0",
            )}
            onLoad={() => setLoaded(true)}
          />
        </Link>
      );
    }
    default: {
      const _exhaustiveCheck: never = bookmarkedAsset.assetType;
      return <span />;
    }
  }
}

export default function AssetCard({
  bookmark: bookmarkedAsset,
  className,
  bookmarkIndex,
}: {
  bookmark: ZBookmarkTypeAsset;
  className?: string;
  bookmarkIndex?: number;
}) {
  return (
    <BookmarkLayoutAdaptingCard
      title={bookmarkedAsset.title ?? bookmarkedAsset.content.fileName}
      footer={
        getSourceUrl(bookmarkedAsset) && (
          <FooterLinkURL url={getSourceUrl(bookmarkedAsset)} />
        )
      }
      bookmark={bookmarkedAsset}
      className={className}
      bookmarkIndex={bookmarkIndex}
      wrapTags={true}
      image={(_layout, className) => (
        <div className="relative size-full flex-1">
          <AssetImage bookmark={bookmarkedAsset} className={className} />
        </div>
      )}
    />
  );
}
