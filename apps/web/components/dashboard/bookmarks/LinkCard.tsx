"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, ImagePlus, Pencil, Tv } from "lucide-react";
import { useUserSettings } from "@/lib/userSettings";
import { cn } from "@/lib/utils";
import { UrlEmbed } from "./UrlEmbed";

import type { ZBookmarkTypeLink } from "@karakeep/shared/types/bookmarks";
import {
  getBookmarkLinkImageUrl,
  getSourceUrl,
  isBookmarkStillCrawling,
} from "@karakeep/shared/utils/bookmarkUtils";

import { BookmarkLayoutAdaptingCard } from "./BookmarkLayoutAdaptingCard";
import { EditBookmarkDialog } from "./EditBookmarkDialog";
import FooterLinkURL from "./FooterLinkURL";

import { renderTextWithLinks } from "./NotePreview";

const useOnClickUrl = (bookmark: ZBookmarkTypeLink) => {
  const userSettings = useUserSettings();
  return {
    urlTarget:
      userSettings.bookmarkClickAction === "open_original_link"
        ? ("_blank" as const)
        : ("_self" as const),
    onClickUrl:
      userSettings.bookmarkClickAction === "expand_bookmark_preview"
        ? `/dashboard/preview/${bookmark.id}`
        : bookmark.content.url,
  };
};

function LinkImage({
  bookmark,
  className,
  onEditImage,
}: {
  bookmark: ZBookmarkTypeLink;
  className?: string;
  onEditImage?: () => void;
}) {
  const { onClickUrl, urlTarget } = useOnClickUrl(bookmark);
  const link = bookmark.content;

  const imgComponent = (url: string, unoptimized: boolean) => (
    <Image
      unoptimized={unoptimized}
      className={className}
      alt="card banner"
      fill={true}
      src={url}
    />
  );

  const imageDetails = getBookmarkLinkImageUrl(link);

  let img: React.ReactNode;
  if (imageDetails) {
    img = imgComponent(imageDetails.url, true);
  } else if (isBookmarkStillCrawling(bookmark)) {
    img = imgComponent("/blur.avif", false);
  } else {
    // No image found
    img = imgComponent(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+P///38ACfsD/QVDRcoAAAAASUVUUIDcG=",
      true,
    );
  }

  return (
    <div className={cn("group/image relative size-full flex-1", className)}>
      <Link
        href={onClickUrl}
        target={urlTarget}
        rel="noreferrer"
        className="size-full"
      >
        <div className="relative size-full flex-1">{img}</div>
      </Link>
      {onEditImage && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEditImage();
          }}
          className="absolute bottom-2 right-2 z-40 inline-flex items-center gap-1.5 rounded-md bg-black/65 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md backdrop-blur-md transition-opacity duration-200 hover:bg-black/85 group-hover/image:opacity-100"
          title="Edit Cover Image"
        >
          <ImagePlus className="size-3.5" />
          <span>Edit Image</span>
        </button>
      )}
    </div>
  );
}

function LinkCardContent({
  bookmark,
  onEditField,
}: {
  bookmark: ZBookmarkTypeLink;
  onEditField?: (field: "title" | "url" | "description") => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const { onClickUrl, urlTarget } = useOnClickUrl(bookmark);

  const url = bookmark.content.url;
  const rawTitle = bookmark.content.title;
  const showTitle = Boolean(
    rawTitle &&
    rawTitle.trim() !== "" &&
    rawTitle.trim().toLowerCase() !== url.trim().toLowerCase(),
  );
  const description = bookmark.content.description || bookmark.summary || "";

  return (
    <div className="flex w-full flex-col gap-1 text-left">
      {/* 1. URL at the top with inline edit button */}
      <div className="group/url flex items-center justify-between gap-1 font-mono text-xs text-muted-foreground">
        <Link
          href={url}
          target="_blank"
          rel="noreferrer"
          className="truncate font-medium text-blue-600 hover:underline dark:text-blue-400"
          onClick={(e) => e.stopPropagation()}
        >
          {url}
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowEmbed(!showEmbed);
            }}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
              showEmbed
                ? "bg-primary text-primary-foreground"
                : "bg-muted/70 text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            title="Toggle Embedded View"
          >
            <Tv className="size-3" />
            <span>{showEmbed ? "Hide Embed" : "Embed"}</span>
          </button>
          {onEditField && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEditField("url");
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover/url:opacity-100"
              title="Edit URL"
            >
              <Pencil className="size-3" />
              <span>Edit URL</span>
            </button>
          )}
        </div>
      </div>

      {showEmbed && (
        <div
          role="region"
          aria-label="Embedded URL View"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="my-1.5"
        >
          <UrlEmbed url={url} onClose={() => setShowEmbed(false)} />
        </div>
      )}

      {/* 2. Title below URL with inline edit button (MAX 1 LINE, no deadspace) */}
      {showTitle ? (
        <div className="group/title flex items-center justify-between gap-1">
          <h3 className="line-clamp-1 flex-1 text-left text-sm font-semibold leading-tight text-foreground">
            <Link
              href={onClickUrl}
              target={urlTarget}
              rel="noreferrer"
              className="hover:underline"
            >
              {rawTitle}
            </Link>
          </h3>
          {onEditField && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEditField("title");
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded px-1 py-0.5 text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover/title:opacity-100"
              title="Edit Title"
            >
              <Pencil className="size-3" />
              <span>Edit Title</span>
            </button>
          )}
        </div>
      ) : (
        onEditField && (
          <div className="group/notitle opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEditField("title");
              }}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-muted-foreground"
            >
              <Pencil className="size-3" />
              <span>+ Add title</span>
            </button>
          </div>
        )
      )}

      {/* 3. Description below Title with inline edit button (MAX 2 LINES, tight gap) */}
      {description ? (
        <div className="group/desc flex flex-col gap-0.5">
          <div className="flex items-start justify-between gap-1">
            <p
              className={cn(
                "flex-1 text-left text-xs leading-snug text-muted-foreground transition-all duration-200",
                !isExpanded && "line-clamp-2",
              )}
            >
              {renderTextWithLinks(description)}
            </p>
            {onEditField && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEditField("description");
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded px-1 py-0.5 text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover/desc:opacity-100"
                title="Edit Description"
              >
                <Pencil className="size-3" />
                <span>Edit Description</span>
              </button>
            )}
          </div>
          {description.length > 80 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-0.5 inline-flex items-center gap-1 self-start rounded bg-muted/50 px-1.5 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-muted hover:text-primary/80"
              title={
                isExpanded ? "Collapse description" : "Expand full description"
              }
            >
              {isExpanded ? (
                <>
                  <span>Less</span>
                  <ChevronUp className="size-3" />
                </>
              ) : (
                <>
                  <span>More</span>
                  <ChevronDown className="size-3" />
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        onEditField && (
          <div className="group/nodesc opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEditField("description");
              }}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-muted-foreground"
            >
              <Pencil className="size-3" />
              <span>+ Add description</span>
            </button>
          </div>
        )
      )}
    </div>
  );
}

export default function LinkCard({
  bookmark: bookmarkLink,
  className,
  bookmarkIndex,
}: {
  bookmark: ZBookmarkTypeLink;
  className?: string;
  bookmarkIndex?: number;
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [focusField, setFocusField] = useState<
    "image" | "title" | "url" | "description" | null
  >(null);

  const handleEditField = (
    field: "image" | "title" | "url" | "description",
  ) => {
    setFocusField(field);
    setEditDialogOpen(true);
  };

  return (
    <>
      <BookmarkLayoutAdaptingCard
        title={null}
        content={
          <LinkCardContent
            bookmark={bookmarkLink}
            onEditField={handleEditField}
          />
        }
        footer={<FooterLinkURL url={getSourceUrl(bookmarkLink)} />}
        bookmark={bookmarkLink}
        wrapTags={false}
        image={(_layout, className) => (
          <LinkImage
            className={className}
            bookmark={bookmarkLink}
            onEditImage={() => handleEditField("image")}
          />
        )}
        className={className}
        bookmarkIndex={bookmarkIndex}
      />
      <EditBookmarkDialog
        open={editDialogOpen}
        setOpen={setEditDialogOpen}
        bookmark={bookmarkLink}
        initialFocusField={focusField}
      />
    </>
  );
}
