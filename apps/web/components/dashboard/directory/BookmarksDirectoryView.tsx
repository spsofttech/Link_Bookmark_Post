"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Layers,
  Bot,
  Terminal,
  Image as ImageIcon,
  Video,
  Code,
  FileText,
  MessageSquare,
  Wrench,
  Search,
  Grid,
  List as ListIcon,
  Plus,
  Download,
  ExternalLink,
  Flame,
  Briefcase,
  BookOpen,
  Github,
  ChevronLeft,
  ChevronRight,
  Settings,
  Webhook,
  Cpu,
  Boxes,
  Sparkles,
  Sun,
  Moon,
  Eye,
  X,
  Play,
  Loader2,
  CheckSquare,
  Square,
  Trash2,
  FolderSync,
  ChevronDown,
  Check,
  Music,
  Tag,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type { ZBookmark } from "@karakeep/shared/types/bookmarks";
import { BookmarkTypes } from "@karakeep/shared/types/bookmarks";
import {
  getBookmarkTitle,
  getSourceUrl,
} from "@karakeep/shared/utils/bookmarkUtils";
import { useTRPC } from "@karakeep/shared-react/trpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useDeleteBookmark,
  useUpdateBookmarkTags,
} from "@karakeep/shared-react/hooks/bookmarks";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditorCard from "../bookmarks/EditorCard";
import BookmarkOptions from "../bookmarks/BookmarkOptions";

// ─── Page size for client-side display chunking ──────────────────────────────
const PAGE_SIZE = 24;

interface CategoryDef {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  iconBg: string;
  description: string;
  tags: string[];
}

const CATEGORY_OPTIONS = [
  {
    id: "skills",
    name: "Skills",
    tag: "skills",
    icon: <Layers className="size-3.5 text-amber-500" />,
  },
  {
    id: "agents",
    name: "Agents",
    tag: "agents",
    icon: <Bot className="size-3.5 text-blue-500" />,
  },
  {
    id: "commands",
    name: "Commands",
    tag: "commands",
    icon: <Terminal className="size-3.5 text-emerald-500" />,
  },
  {
    id: "share-image",
    name: "Share Image",
    tag: "share image",
    icon: <ImageIcon className="size-3.5 text-purple-500" />,
  },
  {
    id: "code-tech",
    name: "Code & Tech",
    tag: "code & tech",
    icon: <Code className="size-3.5 text-cyan-500" />,
  },
  {
    id: "video",
    name: "Video",
    tag: "video",
    icon: <Video className="size-3.5 text-red-500" />,
  },
  {
    id: "article-blog",
    name: "Article & Blog",
    tag: "article & blog",
    icon: <FileText className="size-3.5 text-amber-600" />,
  },
  {
    id: "social-thread",
    name: "Social & Thread",
    tag: "social & thread",
    icon: <MessageSquare className="size-3.5 text-sky-500" />,
  },
];

function getPlatformInfo(url: string | null | undefined) {
  if (!url) {
    return {
      name: "Web Link",
      color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      type: "web",
      videoId: null,
      embedUrl: null,
    };
  }

  const lower = url.toLowerCase();

  // Direct Audio File
  if (/\.(mp3|wav|ogg|m4a|flac|aac)(\?.*)?$/i.test(lower)) {
    return {
      name: "Audio File",
      color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      type: "audio",
      videoId: null,
      embedUrl: url,
    };
  }

  // Direct Video File
  if (/\.(mp4|webm|ogv|mov)(\?.*)?$/i.test(lower)) {
    return {
      name: "Video File",
      color: "bg-red-500/10 text-red-500 border-red-500/20",
      type: "videofile",
      videoId: null,
      embedUrl: url,
    };
  }

  // Direct Image File
  if (/\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(lower)) {
    return {
      name: "Image Asset",
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      type: "image",
      videoId: null,
      embedUrl: url,
    };
  }

  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?/\s]{11})/i,
    );
    return {
      name: "YouTube",
      color: "bg-red-500/10 text-red-500 border-red-500/20",
      type: "youtube",
      videoId: ytMatch ? ytMatch[1] : null,
      embedUrl: ytMatch
        ? `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
        : null,
    };
  }

  if (lower.includes("twitter.com") || lower.includes("x.com")) {
    const tweetMatch = url.match(
      /(?:twitter|x)\.com\/(?:#!\/)?\w+\/status(?:es)?\/([\d]+)/i,
    );
    return {
      name: "X / Twitter",
      color: "bg-sky-500/10 text-sky-500 border-sky-500/20",
      type: "twitter",
      videoId: tweetMatch ? tweetMatch[1] : null,
      embedUrl: tweetMatch ? url : null,
    };
  }

  if (lower.includes("instagram.com")) {
    const igMatch = url.match(/instagram\.com\/(?:p|reel)\/([^/?#&]+)/i);
    return {
      name: "Instagram",
      color: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      type: "instagram",
      videoId: null,
      embedUrl: igMatch
        ? `https://www.instagram.com/p/${igMatch[1]}/embed`
        : url,
    };
  }

  if (lower.includes("github.com")) {
    return {
      name: "GitHub",
      color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      type: "github",
      videoId: null,
      embedUrl: null,
    };
  }

  if (lower.includes("threads.net")) {
    return {
      name: "Threads",
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      type: "threads",
      videoId: null,
      embedUrl: url,
    };
  }

  if (lower.includes("reddit.com")) {
    return {
      name: "Reddit",
      color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      type: "reddit",
      videoId: null,
      embedUrl: url,
    };
  }

  if (lower.includes("tiktok.com")) {
    const tiktokMatch = url.match(/video\/(\d+)/i);
    return {
      name: "TikTok",
      color: "bg-pink-600/10 text-pink-600 border-pink-600/20",
      type: "tiktok",
      videoId: tiktokMatch ? tiktokMatch[1] : null,
      embedUrl: tiktokMatch
        ? `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`
        : url,
    };
  }

  if (lower.includes("vimeo.com")) {
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/i);
    return {
      name: "Vimeo",
      color: "bg-sky-600/10 text-sky-600 border-sky-600/20",
      type: "vimeo",
      videoId: vimeoMatch ? vimeoMatch[1] : null,
      embedUrl: vimeoMatch
        ? `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
        : url,
    };
  }

  if (lower.includes("linkedin.com")) {
    return {
      name: "LinkedIn",
      color: "bg-blue-600/10 text-blue-600 border-blue-600/20",
      type: "linkedin",
      videoId: null,
      embedUrl: url,
    };
  }

  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return {
      name: host,
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      type: "web",
      videoId: null,
      embedUrl: url,
    };
  } catch {
    return {
      name: "Web Link",
      color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      type: "web",
      videoId: null,
      embedUrl: url,
    };
  }
}

// ─── Single card transform ───────────────────────────────────────────────────
function transformBookmark(b: ZBookmark, index: number) {
  const title = getBookmarkTitle(b) || "Untitled Post";
  const summary =
    b.summary ||
    b.note ||
    (b.content.type === BookmarkTypes.LINK ? b.content.description : "") ||
    "Bookmark post.";
  const categoryTag = b.tags?.[0]?.name || "general";
  const statsCount = Math.floor(Math.abs(Math.sin(index + 1) * 35000)) + 5000;
  const rawUrl = getSourceUrl(b);
  const url = rawUrl || "";
  const platform = getPlatformInfo(url);

  let previewImage: string | null = null;
  if (b.content.type === BookmarkTypes.LINK && b.content.imageUrl) {
    previewImage = b.content.imageUrl;
  } else if (b.content.type === BookmarkTypes.ASSET && b.content.assetId) {
    previewImage = `/api/assets/${b.content.assetId}`;
  } else if (platform.type === "youtube" && platform.videoId) {
    previewImage = `https://img.youtube.com/vi/${platform.videoId}/hqdefault.jpg`;
  }

  return {
    id: b.id,
    bookmark: b,
    title,
    summary,
    categoryTag,
    statsCount,
    url,
    previewImage,
    platform,
    domain: url ? platform.name : "web",
  };
}

// ─── Twitter/X official oEmbed widget component (Memoized to prevent reload on scroll) ──────
const TwitterEmbedFrame = memo(function TwitterEmbedFrame({
  url,
  tweetId: _tweetId,
}: {
  url: string;
  tweetId: string | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { margin:0; background:#15202b; display:flex; align-items:flex-start;
           justify-content:center; padding:16px; min-height:100vh; box-sizing:border-box; }
    .twitter-tweet { max-width:550px!important; width:100%!important; }
  </style>
</head>
<body>
  <blockquote class="twitter-tweet" data-dnt="true" data-theme="dark">
    <a href="${url.replace(/"/g, "&quot;")}"></a>
  </blockquote>
  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    iframeRef.current.src = blobUrl;
    return () => URL.revokeObjectURL(blobUrl);
  }, [url]);

  return (
    <div className="flex h-full w-full flex-col items-center overflow-y-auto bg-[#15202b]">
      <iframe
        ref={iframeRef}
        title="X / Twitter post"
        className="h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
});

// ─── Open-in-new-tab fallback ──────────────────────────────────────────────
function PlatformOpenInTab({
  url,
  platformName,
  icon,
  note,
}: {
  url: string;
  platformName: string;
  icon: string;
  note: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-card text-4xl shadow-inner">
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="text-base font-bold text-foreground">{platformName}</h4>
        <p className="max-w-xs text-sm text-muted-foreground">{note}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:bg-amber-600 active:scale-95"
      >
        <ExternalLink className="size-4" />
        Open on {platformName}
      </a>
    </div>
  );
}

// ─── Standalone Memoized Embed Modal (NO Reload on Parent Scroll) ─────────────
interface EmbedItem {
  title: string;
  url: string;
  platform: ReturnType<typeof getPlatformInfo>;
}

const EmbedModalDialog = memo(function EmbedModalDialog({
  item,
  onClose,
}: {
  item: EmbedItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md duration-200 animate-in fade-in">
      <div className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Modal Header */}
        <div className="flex h-14 items-center justify-between border-b border-border bg-card px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-semibold",
                item.platform.color,
              )}
            >
              {item.platform.name}
            </span>
            <h3 className="line-clamp-1 text-sm font-bold text-foreground">
              {item.title}
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <span>Open Original Link</span>
              <ExternalLink className="size-3.5" />
            </a>
            <button
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Live Embed Frame */}
        <div className="relative flex-1 bg-black/90">
          {item.platform.type === "youtube" && item.platform.embedUrl ? (
            <iframe
              src={item.platform.embedUrl}
              title={item.title}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : item.platform.type === "vimeo" && item.platform.embedUrl ? (
            <iframe
              src={item.platform.embedUrl}
              title={item.title}
              className="h-full w-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : item.platform.type === "twitter" && item.platform.embedUrl ? (
            <TwitterEmbedFrame
              url={item.platform.embedUrl}
              tweetId={item.platform.videoId}
            />
          ) : item.platform.type === "instagram" && item.platform.embedUrl ? (
            <iframe
              src={item.platform.embedUrl}
              title={item.title}
              className="h-full w-full border-0 bg-white"
            />
          ) : item.platform.type === "tiktok" && item.platform.embedUrl ? (
            <iframe
              src={item.platform.embedUrl}
              title={item.title}
              className="h-full w-full border-0 bg-black"
            />
          ) : item.platform.type === "audio" ? (
            <div className="flex h-full flex-col items-center justify-center bg-black/95 p-8 text-center">
              <div className="mb-6 flex size-20 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/20 text-purple-400 shadow-xl">
                <Music className="size-10" />
              </div>
              <h4 className="mb-2 text-lg font-bold text-white">
                {item.title}
              </h4>
              <p className="mb-6 max-w-md truncate text-xs text-gray-400">
                {item.url}
              </p>
              {/* oxlint-disable-next-line eslint-plugin-jsx-a11y/media-has-caption */}
              <audio
                controls
                autoPlay
                src={item.url}
                className="w-full max-w-md"
              />
            </div>
          ) : item.platform.type === "videofile" ? (
            <div className="flex h-full items-center justify-center bg-black p-4">
              {/* oxlint-disable-next-line eslint-plugin-jsx-a11y/media-has-caption */}
              <video
                controls
                autoPlay
                src={item.url}
                className="max-h-full max-w-full rounded-xl"
              />
            </div>
          ) : item.platform.type === "image" ? (
            <div className="flex h-full items-center justify-center bg-black/95 p-4">
              {/* oxlint-disable-next-line eslint-plugin-next/no-img-element */}
              <img
                src={item.url}
                alt={item.title}
                className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>
          ) : item.platform.type === "github" ? (
            <PlatformOpenInTab
              url={item.url}
              platformName="GitHub"
              icon="🐙"
              note="GitHub security headers block embedded iFrames. Click below to view repo on GitHub."
            />
          ) : (
            <div className="flex h-full w-full flex-col">
              <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="size-3.5" />
                  Live Web Preview — If website blocks framing, click Open
                  Original Link.
                </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-bold underline hover:text-amber-400"
                >
                  Open in New Tab <ExternalLink className="size-3" />
                </a>
              </div>
              <iframe
                src={item.url}
                title={item.title}
                className="h-full w-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Standalone Memoized Card Item (NO Reload / Re-render on Scroll) ──────────
const BookmarkCardItem = memo(function BookmarkCardItem({
  item,
  isSelected,
  currentCategoryIcon,
  onToggleSelect,
  onOpenEmbed,
  onSingleDelete,
  onSingleCategoryChange,
}: {
  item: ReturnType<typeof transformBookmark>;
  isSelected: boolean;
  currentCategoryIcon: React.ReactNode;
  onToggleSelect: (id: string) => void;
  onOpenEmbed: (item: EmbedItem) => void;
  onSingleDelete: (id: string, title: string) => void;
  onSingleCategoryChange: (
    bookmark: ZBookmark,
    tag: string,
    name: string,
  ) => void;
}) {
  return (
    <div
      className={cn(
        "shadow-xs group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card transition-all duration-200",
        isSelected
          ? "border-amber-500 ring-2 ring-amber-500/30 dark:border-amber-500"
          : "border-border hover:border-amber-500/70 hover:shadow-md dark:hover:border-amber-500/70",
      )}
    >
      {/* Embedded Visual Preview Box */}
      <div className="relative h-40 w-full overflow-hidden border-b border-border bg-muted/40">
        {item.previewImage ? (
          // oxlint-disable-next-line eslint-plugin-next/no-img-element
          <img
            src={item.previewImage}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }}
          />
        ) : null}

        {/* Fallback Graphic Box */}
        <div
          style={{
            display: item.previewImage ? "none" : "flex",
          }}
          className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-amber-500/15 via-background to-orange-500/15 p-4"
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
                item.platform.color,
              )}
            >
              {item.platform.name}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-500">
              {currentCategoryIcon}
            </div>
          </div>
          <p className="line-clamp-2 font-mono text-[11px] text-muted-foreground">
            {item.url || item.summary}
          </p>
        </div>

        {/* Selection Checkbox Overlay */}
        <button
          onClick={() => onToggleSelect(item.id)}
          className={cn(
            "absolute left-3 top-3 z-10 flex size-7 items-center justify-center rounded-lg border shadow-md backdrop-blur-md transition-all",
            isSelected
              ? "border-amber-500 bg-amber-500 text-white"
              : "border-border/80 bg-background/80 text-muted-foreground hover:border-amber-500 hover:text-amber-500",
          )}
          title={isSelected ? "Deselect item" : "Select item"}
        >
          {isSelected ? (
            <CheckSquare className="size-4 fill-current" />
          ) : (
            <Square className="size-4" />
          )}
        </button>

        {/* Live Interactive Embed Button Overlay */}
        {item.url && (
          <button
            onClick={() =>
              onOpenEmbed({
                title: item.title,
                url: item.url,
                platform: item.platform,
              })
            }
            className="shadow-xs absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-amber-500 hover:text-white"
            title="Open interactive embed preview"
          >
            {item.platform.type === "youtube" ? (
              <Play className="size-3 fill-current" />
            ) : (
              <Eye className="size-3" />
            )}
            <span>Embed Preview</span>
          </button>
        )}
      </div>

      {/* Card Main Content */}
      <div className="space-y-3 p-4">
        {/* Card Title & Icon */}
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-500">
            {currentCategoryIcon}
          </div>

          <div className="min-w-0 flex-1">
            <a
              href={item.url || "#"}
              target={item.url ? "_blank" : "_self"}
              rel="noreferrer"
              className="line-clamp-1 text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400"
            >
              {item.title}
            </a>
          </div>

          {item.bookmark && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSingleDelete(item.id, item.title)}
                className="flex size-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground opacity-0 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                title="Delete bookmark"
              >
                <Trash2 className="size-3.5" />
              </button>
              <BookmarkOptions bookmark={item.bookmark} />
            </div>
          )}
        </div>

        {/* Card Description */}
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {item.summary}
        </p>
      </div>

      {/* Bottom Bar: 1-Click Category Dropdown + Link */}
      <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2 overflow-hidden">
          {item.bookmark ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 rounded-md border border-border bg-background/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground transition-all hover:border-amber-500 hover:text-amber-500">
                  <Tag className="size-2.5 text-amber-500" />
                  <span>{item.categoryTag}</span>
                  <ChevronDown className="size-2.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="z-50 w-48">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Change Category
                </div>
                <DropdownMenuSeparator />
                {CATEGORY_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.id}
                    onClick={() =>
                      onSingleCategoryChange(item.bookmark!, opt.tag, opt.name)
                    }
                    className="flex cursor-pointer items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span>{opt.name}</span>
                    </div>
                    {item.categoryTag.toLowerCase() ===
                      opt.tag.toLowerCase() && (
                      <Check className="size-3.5 text-amber-500" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {item.categoryTag}
            </span>
          )}

          <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <Download className="size-2.5" />
            <span>{item.statsCount.toLocaleString()}</span>
          </div>
        </div>

        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-mono text-[11px] font-semibold text-amber-600 transition-colors hover:underline dark:text-amber-400"
          >
            <span className="max-w-[110px] truncate">
              {item.url.replace(/^https?:\/\//, "")}
            </span>
            <ExternalLink className="size-3 shrink-0" />
          </a>
        ) : (
          <button className="flex size-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-amber-500 hover:text-amber-500">
            <Plus className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
});

export default function BookmarksDirectoryView({
  bookmarks,
  _showEditorCard = true,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage = () => ({}),
}: {
  bookmarks: ZBookmark[];
  _showEditorCard?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // DEFAULT SORT BY NEWEST (Requirement #5)
  const [sortBy, setSortBy] = useState<
    "popular" | "newest" | "oldest" | "alphabetical"
  >("newest");

  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  // Multi-Selection State (Requirement #2)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);

  // Client-side pagination (display chunks)
  const [displayPage, setDisplayPage] = useState<number>(1);

  // Active Embed Preview Modal State (Requirement #4 - Memoized to NOT reload on scroll)
  const [activeEmbedItem, setActiveEmbedItem] = useState<EmbedItem | null>(
    null,
  );

  const handleOpenEmbed = useCallback((item: EmbedItem) => {
    setActiveEmbedItem(item);
  }, []);

  const handleCloseEmbed = useCallback(() => {
    setActiveEmbedItem(null);
  }, []);

  // Scroll sentinel ref for infinite scroll within the main area
  const scrollSentinelRef = useRef<HTMLDivElement | null>(null);
  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  const queryClient = useQueryClient();
  const api = useTRPC();
  const deleteBookmarkMutation = useDeleteBookmark();
  const updateTagsMutation = useUpdateBookmarkTags();

  // Helper for immediate UI update & toast notification after CRUD (Requirement #1)
  const refreshWorkspace = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries(api.bookmarks.getBookmarks.pathFilter()),
      queryClient.invalidateQueries(
        api.bookmarks.getBookmarkCounts.pathFilter(),
      ),
      queryClient.invalidateQueries(api.bookmarks.searchBookmarks.pathFilter()),
      queryClient.refetchQueries(api.bookmarks.getBookmarks.pathFilter()),
    ]);
  }, [api, queryClient]);

  // ── Real Supabase counts (fetched once, not paginated) ────────────────────
  const { data: dbCounts } = useQuery(
    api.bookmarks.getBookmarkCounts.queryOptions(undefined, {
      staleTime: 30_000,
    }),
  );

  // Category stats calculation
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {
      all: bookmarks.length,
      skills: 0,
      agents: 0,
      commands: 0,
      "share-image": 0,
      "code-tech": 0,
      video: 0,
      "article-blog": 0,
      "social-thread": 0,
      "audio-podcast": 0,
      "document-pdf": 0,
      "product-tool": 0,
      settings: 0,
      hooks: 0,
      mcps: 0,
      mods: 0,
      plugins: 0,
    };

    for (const b of bookmarks) {
      const tagNames = b.tags?.map((t) => t.name.toLowerCase()) ?? [];
      const title = (getBookmarkTitle(b) ?? "").toLowerCase();
      const summary = (b.summary ?? b.note ?? "").toLowerCase();
      const url = (getSourceUrl(b) ?? "").toLowerCase();
      const fullText = `${title} ${summary} ${url} ${tagNames.join(" ")}`;

      if (tagNames.includes("skills") || fullText.includes("skill"))
        stats.skills++;
      if (tagNames.includes("agents") || fullText.includes("agent"))
        stats.agents++;
      if (tagNames.includes("commands") || fullText.includes("command"))
        stats.commands++;
      if (
        tagNames.includes("share image") ||
        b.content.type === BookmarkTypes.ASSET ||
        /\.(png|jpg|jpeg|gif|webp|svg)/i.test(url)
      )
        stats["share-image"]++;
      if (
        tagNames.includes("code & tech") ||
        /(github|stack|dev\.to|npm|code)/i.test(fullText)
      )
        stats["code-tech"]++;
      if (
        tagNames.includes("video") ||
        /(youtube|youtu|vimeo|tiktok|video|\.mp4)/i.test(fullText)
      )
        stats.video++;
      if (
        tagNames.includes("article & blog") ||
        /(medium|substack|blog|article)/i.test(fullText)
      )
        stats["article-blog"]++;
      if (
        tagNames.includes("social & thread") ||
        /(twitter|x\.com|reddit|linkedin)/i.test(fullText)
      )
        stats["social-thread"]++;
      if (
        tagNames.includes("audio & podcast") ||
        /(spotify|podcast|audio|\.mp3)/i.test(fullText)
      )
        stats["audio-podcast"]++;
      if (
        tagNames.includes("document & pdf") ||
        /(\.pdf|doc|paper)/i.test(fullText)
      )
        stats["document-pdf"]++;
      if (
        tagNames.includes("product & tool") ||
        /(producthunt|saas|tool)/i.test(fullText)
      )
        stats["product-tool"]++;
    }

    if (dbCounts) {
      stats.all = dbCounts.total;
      const dbTagMap = new Map<string, number>();
      for (const { tagName, count } of dbCounts.perTag) {
        dbTagMap.set(tagName.toLowerCase(), count);
      }
      const dbMax = (keys: string[]) =>
        keys.reduce((acc, k) => acc + (dbTagMap.get(k) ?? 0), 0);

      stats.skills = Math.max(stats.skills, dbMax(["skills", "skill"]));
      stats.agents = Math.max(stats.agents, dbMax(["agents", "agent"]));
      stats.commands = Math.max(stats.commands, dbMax(["commands", "command"]));
      stats["share-image"] = Math.max(
        stats["share-image"],
        dbMax(["share image", "share-image", "image"]),
      );
      stats["code-tech"] = Math.max(
        stats["code-tech"],
        dbMax(["code & tech", "code-tech", "code", "tech"]),
      );
      stats.video = Math.max(stats.video, dbMax(["video"]));
      stats["article-blog"] = Math.max(
        stats["article-blog"],
        dbMax(["article & blog", "article-blog", "article", "blog"]),
      );
      stats["social-thread"] = Math.max(
        stats["social-thread"],
        dbMax(["social & thread", "social-thread", "social", "thread"]),
      );
      stats["audio-podcast"] = Math.max(
        stats["audio-podcast"],
        dbMax(["audio & podcast", "audio-podcast", "audio", "podcast"]),
      );
      stats["document-pdf"] = Math.max(
        stats["document-pdf"],
        dbMax(["document & pdf", "document-pdf", "document", "pdf"]),
      );
      stats["product-tool"] = Math.max(
        stats["product-tool"],
        dbMax(["product & tool", "product-tool", "product", "tool"]),
      );
      stats.hooks = Math.max(stats.hooks, dbMax(["hooks", "hook"]));
      stats.mcps = Math.max(stats.mcps, dbMax(["mcps", "mcp"]));
      stats.mods = Math.max(stats.mods, dbMax(["mods", "mod"]));
      stats.plugins = Math.max(stats.plugins, dbMax(["plugins", "plugin"]));
    }

    return stats;
  }, [bookmarks, dbCounts]);

  const categories: CategoryDef[] = useMemo(
    () => [
      {
        id: "skills",
        name: "Skills",
        count: categoryStats.skills,
        icon: <Layers className="size-4 text-amber-500" />,
        iconBg: "bg-amber-500/10 border-amber-500/20 text-amber-500",
        description:
          "Pre-built templates and configurations to supercharge your AI workflow",
        tags: ["creative-design", "development", "web-development", "data-ai"],
      },
      {
        id: "agents",
        name: "Agents",
        count: categoryStats.agents,
        icon: <Bot className="size-4 text-blue-500" />,
        iconBg: "bg-blue-500/10 border-blue-500/20 text-blue-500",
        description: "Specialized AI agents for every development task",
        tags: [
          "development-team",
          "development-tools",
          "ai-specialists",
          "database",
        ],
      },
      {
        id: "commands",
        name: "Commands",
        count: categoryStats.commands,
        icon: <Terminal className="size-4 text-emerald-500" />,
        iconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
        description: "CLI shortcuts and executable automation commands",
        tags: ["cli", "automation", "scripts"],
      },
      {
        id: "share-image",
        name: "Share Image",
        count: categoryStats["share-image"],
        icon: <ImageIcon className="size-4 text-purple-500" />,
        iconBg: "bg-purple-500/10 border-purple-500/20 text-purple-500",
        description:
          "Curated collection of images, visual infographics, and design templates",
        tags: ["graphics", "ui-ux", "visuals"],
      },
      {
        id: "code-tech",
        name: "Code & Tech",
        count: categoryStats["code-tech"],
        icon: <Code className="size-4 text-cyan-500" />,
        iconBg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500",
        description:
          "Developer repositories, gists, code snippets, and frameworks",
        tags: ["programming", "react", "typescript"],
      },
      {
        id: "video",
        name: "Video",
        count: categoryStats.video,
        icon: <Video className="size-4 text-red-500" />,
        iconBg: "bg-red-500/10 border-red-500/20 text-red-500",
        description: "Video tutorials, tech talks, and visual demonstrations",
        tags: ["media", "tutorials"],
      },
      {
        id: "article-blog",
        name: "Article & Blog",
        count: categoryStats["article-blog"],
        icon: <FileText className="size-4 text-amber-600" />,
        iconBg: "bg-amber-600/10 border-amber-600/20 text-amber-600",
        description:
          "Deep-dive articles, longform blog posts, and documentation",
        tags: ["reading", "blogs"],
      },
      {
        id: "social-thread",
        name: "Social & Thread",
        count: categoryStats["social-thread"],
        icon: <MessageSquare className="size-4 text-sky-500" />,
        iconBg: "bg-sky-500/10 border-sky-500/20 text-sky-500",
        description: "Curated social discussions, threads, and community posts",
        tags: ["discussions", "twitter"],
      },
    ],
    [categoryStats],
  );

  const currentCategoryObj = useMemo(
    () =>
      categories.find((c) => c.id === activeCategory) ?? {
        id: "all",
        name: "All Components",
        count: categoryStats.all,
        icon: <Boxes className="size-4 text-amber-500" />,
        iconBg: "bg-amber-500/10 border-amber-500/20 text-amber-500",
        description:
          "All posts and bookmarks organized by category across your workspace",
        tags: ["all"],
      },
    [activeCategory, categories, categoryStats.all],
  );

  // Filter & Sort
  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;

    if (activeCategory !== "all") {
      result = result.filter((b) => {
        const tagNames = b.tags?.map((t) => t.name.toLowerCase()) ?? [];
        const title = (getBookmarkTitle(b) ?? "").toLowerCase();
        const summary = (b.summary ?? b.note ?? "").toLowerCase();
        const url = (getSourceUrl(b) ?? "").toLowerCase();
        const fullText = `${title} ${summary} ${url} ${tagNames.join(" ")}`;

        if (activeCategory === "skills")
          return tagNames.includes("skills") || fullText.includes("skill");
        if (activeCategory === "agents")
          return tagNames.includes("agents") || fullText.includes("agent");
        if (activeCategory === "commands")
          return tagNames.includes("commands") || fullText.includes("command");
        if (activeCategory === "share-image")
          return (
            tagNames.includes("share image") ||
            b.content.type === BookmarkTypes.ASSET ||
            /\.(png|jpg|jpeg|gif|webp|svg)/i.test(url)
          );
        if (activeCategory === "code-tech")
          return (
            tagNames.includes("code & tech") ||
            /(github|stack|dev\.to|npm|code)/i.test(fullText)
          );
        if (activeCategory === "video")
          return (
            tagNames.includes("video") ||
            /(youtube|youtu|vimeo|tiktok|video|\.mp4)/i.test(fullText)
          );
        if (activeCategory === "article-blog")
          return (
            tagNames.includes("article & blog") ||
            /(medium|substack|blog|article)/i.test(fullText)
          );
        if (activeCategory === "social-thread")
          return (
            tagNames.includes("social & thread") ||
            /(twitter|x\.com|reddit|linkedin)/i.test(fullText)
          );
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) => {
        const title = (getBookmarkTitle(b) ?? "").toLowerCase();
        const summary = (b.summary ?? b.note ?? "").toLowerCase();
        const url = (getSourceUrl(b) ?? "").toLowerCase();
        return title.includes(q) || summary.includes(q) || url.includes(q);
      });
    }

    if (sortBy === "alphabetical") {
      result = [...result].sort((a, b) =>
        (getBookmarkTitle(a) ?? "").localeCompare(getBookmarkTitle(b) ?? ""),
      );
    } else if (sortBy === "newest") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === "oldest") {
      result = [...result].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }

    return result;
  }, [bookmarks, activeCategory, searchQuery, sortBy]);

  // Reset display page when filter/sort changes
  useEffect(() => {
    setDisplayPage(1);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [activeCategory, searchQuery, sortBy]);

  // Items visible so far
  const visibleBookmarks = useMemo(
    () => filteredBookmarks.slice(0, displayPage * PAGE_SIZE),
    [filteredBookmarks, displayPage],
  );

  const hasMoreClientPages = visibleBookmarks.length < filteredBookmarks.length;

  // Intersection observer for auto-loading more items
  const handleSentinelIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (!entries[0]?.isIntersecting) return;
      if (hasMoreClientPages) {
        setDisplayPage((p) => p + 1);
      } else if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasMoreClientPages, hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleSentinelIntersect, {
      root: mainScrollRef.current,
      threshold: 0.1,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleSentinelIntersect]);

  // Memoised transform for visible items
  const displayItems = useMemo(
    () => visibleBookmarks.map((b, i) => transformBookmark(b, i)),
    [visibleBookmarks],
  );

  // ── Multi-selection handlers ──────────────────────────────────────────────
  const toggleSelectBookmark = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (
      selectedIds.size === visibleBookmarks.length &&
      visibleBookmarks.length > 0
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleBookmarks.map((b) => b.id)));
    }
  }, [selectedIds.size, visibleBookmarks]);

  // ── Single & Bulk Delete Actions with instant update & notification ──
  const handleSingleDelete = useCallback(
    async (bookmarkId: string, title: string) => {
      try {
        await deleteBookmarkMutation.mutateAsync({ bookmarkId });
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(bookmarkId);
          return next;
        });
        await refreshWorkspace();
        toast.success(`Deleted "${title}" successfully`);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to delete bookmark";
        toast.error(msg);
      }
    },
    [deleteBookmarkMutation, refreshWorkspace],
  );

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (
      !window.confirm(
        `Are you sure you want to delete ${count} selected bookmark${count > 1 ? "s" : ""}?`,
      )
    ) {
      return;
    }

    setIsBulkProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) => deleteBookmarkMutation.mutateAsync({ bookmarkId: id })),
      );
      setSelectedIds(new Set());
      await refreshWorkspace();
      toast.success(
        `Successfully deleted ${count} bookmark${count > 1 ? "s" : ""}`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete selected items";
      toast.error(msg);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // ── Single & Bulk Category Change Actions ───────────
  const handleSingleCategoryChange = useCallback(
    async (
      bookmark: ZBookmark,
      newCategoryTag: string,
      newCategoryName: string,
    ) => {
      try {
        const oldTagIds = (bookmark.tags ?? []).map((t) => ({ tagId: t.id }));
        await updateTagsMutation.mutateAsync({
          bookmarkId: bookmark.id,
          attach: [{ tagName: newCategoryTag, attachedBy: "human" }],
          detach: oldTagIds,
        });
        await refreshWorkspace();
        toast.success(`Moved bookmark to "${newCategoryName}"`);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to update category";
        toast.error(msg);
      }
    },
    [updateTagsMutation, refreshWorkspace],
  );

  const handleBulkCategoryChange = async (
    newCategoryTag: string,
    newCategoryName: string,
  ) => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setIsBulkProcessing(true);

    try {
      const selectedBookmarks = bookmarks.filter((b) => selectedIds.has(b.id));
      await Promise.all(
        selectedBookmarks.map((b) => {
          const oldTagIds = (b.tags ?? []).map((t) => ({ tagId: t.id }));
          return updateTagsMutation.mutateAsync({
            bookmarkId: b.id,
            attach: [{ tagName: newCategoryTag, attachedBy: "human" }],
            detach: oldTagIds,
          });
        }),
      );
      setSelectedIds(new Set());
      await refreshWorkspace();
      toast.success(
        `Successfully moved ${count} bookmark${count > 1 ? "s" : ""} to "${newCategoryName}"`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update categories";
      toast.error(msg);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground">
      {/* 1. Primary Left Page Sidebar */}
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-border bg-card/60 transition-all duration-200",
          showSidebar ? "w-64" : "w-16",
        )}
      >
        {/* Logo & Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {showSidebar && (
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 font-bold text-amber-500">
                <Sparkles className="size-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                AI Templates
              </span>
            </div>
          )}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {showSidebar ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {/* WORKPLACE */}
          <div>
            {showSidebar && (
              <h4 className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                WORKPLACE
              </h4>
            )}
            <div className="mt-2 space-y-1">
              <button
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  activeCategory === "all"
                    ? "bg-amber-500/10 font-semibold text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Boxes className="size-4 shrink-0 text-amber-500" />
                {showSidebar && (
                  <span className="line-clamp-1 flex-1 text-left">
                    My Components
                  </span>
                )}
                {showSidebar && (
                  <span className="flex items-center gap-1 text-[10px] font-normal text-muted-foreground">
                    {dbCounts ? (
                      <span className="font-semibold text-foreground">
                        {dbCounts.total}
                      </span>
                    ) : (
                      <>
                        {isFetchingNextPage && (
                          <Loader2 className="size-2.5 animate-spin" />
                        )}
                        {categoryStats.all}
                        {hasNextPage ? "+" : ""}
                      </>
                    )}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* BROWSE CATEGORIES */}
          <div>
            {showSidebar && (
              <h4 className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                BROWSE
              </h4>
            )}
            <div className="mt-2 space-y-1">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                      isActive
                        ? "shadow-xs bg-amber-500/10 font-semibold text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <div className="shrink-0">{cat.icon}</div>
                    {showSidebar && (
                      <span className="line-clamp-1 flex-1 text-left">
                        {cat.name}
                      </span>
                    )}
                    {showSidebar && (
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                          isActive
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {cat.count}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Extra menu items */}
              {[
                {
                  name: "Settings",
                  count: categoryStats.settings,
                  icon: <Settings className="size-4 text-gray-400" />,
                },
                {
                  name: "Hooks",
                  count: categoryStats.hooks,
                  icon: <Webhook className="size-4 text-gray-400" />,
                },
                {
                  name: "MCPs",
                  count: categoryStats.mcps,
                  icon: <Cpu className="size-4 text-gray-400" />,
                },
                {
                  name: "Mods",
                  count: categoryStats.mods,
                  icon: <Wrench className="size-4 text-gray-400" />,
                },
                {
                  name: "Plugins",
                  count: categoryStats.plugins,
                  icon: <Boxes className="size-4 text-gray-400" />,
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
                >
                  <div className="shrink-0">{item.icon}</div>
                  {showSidebar && (
                    <span className="flex-1 text-left">{item.name}</span>
                  )}
                  {showSidebar && (
                    <span className="text-[10px] text-muted-foreground/60">
                      {item.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RESOURCES */}
          <div>
            {showSidebar && (
              <h4 className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                RESOURCES
              </h4>
            )}
            <div className="mt-2 space-y-1">
              {[
                {
                  name: "Trending",
                  icon: <Flame className="size-4 text-orange-500" />,
                },
                {
                  name: "Jobs",
                  badge: "NEW",
                  icon: <Briefcase className="size-4 text-blue-500" />,
                },
                {
                  name: "Blog",
                  icon: <BookOpen className="size-4 text-emerald-500" />,
                },
                {
                  name: "Docs",
                  icon: <FileText className="size-4 text-purple-500" />,
                },
                {
                  name: "GitHub",
                  icon: <Github className="size-4 text-gray-400" />,
                },
              ].map((res) => (
                <div
                  key={res.name}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <div className="shrink-0">{res.icon}</div>
                  {showSidebar && (
                    <span className="flex-1 text-left">{res.name}</span>
                  )}
                  {showSidebar && "badge" in res && res.badge && (
                    <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      {res.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-accent">
            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-xs font-bold text-white">
              SG
            </div>
            {showSidebar && (
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-semibold tracking-tight text-foreground">
                  Siddharath Gajera
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  Pro Member
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Primary Page Content Area & Header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/40 px-6 backdrop-blur-md">
          {/* Global Search */}
          <div className="relative flex w-full max-w-md items-center">
            <span className="absolute left-3 font-mono text-xs text-muted-foreground">
              &gt;
            </span>
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/40 py-1.5 pl-8 pr-12 text-xs text-foreground transition-all placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <kbd className="absolute right-3 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘ K
            </kbd>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => refreshWorkspace()}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              title="Refresh workspace data"
            >
              <RefreshCw className="size-3.5" />
              <span>Refresh</span>
            </button>

            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Github className="size-3.5" />
              <span>GitHub</span>
              <span className="font-normal text-muted-foreground">★ 32.3k</span>
            </a>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
          </div>
        </header>

        {/* Main Scrollable Body */}
        <main
          ref={mainScrollRef}
          className="flex-1 space-y-6 overflow-y-auto p-8"
        >
          {/* Add Post & Import Section */}
          <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-foreground">
                    Add Post & Import Data
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Paste URLs from X, Instagram, YouTube, TikTok, Threads,
                    Reddit, notes, or upload CSV/Excel/JSON files.
                  </p>
                </div>
              </div>
            </div>
            <EditorCard />
          </div>

          {/* Active Category Header Banner */}
          <div className="shadow-xs flex items-center gap-5 rounded-2xl border border-border bg-card p-6">
            <div
              className={cn(
                "shadow-xs flex size-14 shrink-0 items-center justify-center rounded-2xl border p-3",
                currentCategoryObj.iconBg,
              )}
            >
              {currentCategoryObj.icon}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {currentCategoryObj.name}
              </h1>
              <p className="max-w-xl text-xs text-muted-foreground">
                {currentCategoryObj.description}
              </p>
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="shadow-xs flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card/60 p-3">
            <div className="flex min-w-[280px] flex-1 flex-wrap items-center gap-3">
              {/* Select All Checkbox Button */}
              <button
                onClick={toggleSelectAll}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                  selectedIds.size > 0 &&
                    selectedIds.size === visibleBookmarks.length
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-border bg-background text-foreground hover:bg-accent",
                )}
              >
                {selectedIds.size > 0 &&
                selectedIds.size === visibleBookmarks.length ? (
                  <CheckSquare className="size-4 text-amber-500" />
                ) : (
                  <Square className="size-4 text-muted-foreground" />
                )}
                <span>
                  {selectedIds.size > 0
                    ? `Selected (${selectedIds.size})`
                    : "Select All"}
                </span>
              </button>

              {/* Toolbar Search Input */}
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Category Select Dropdown */}
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-xs transition-colors",
                    viewMode === "grid"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Grid className="size-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-xs transition-colors",
                    viewMode === "list"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <ListIcon className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Sort Dropdown (Defaulting to Newest) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Sort by
              </span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "popular"
                      | "newest"
                      | "oldest"
                      | "alphabetical",
                  )
                }
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:border-amber-500 focus:outline-none"
              >
                <option value="newest">Newest (Default)</option>
                <option value="popular">Most Popular</option>
                <option value="oldest">Oldest</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Sub Header: Component Count */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-muted-foreground">
              {isFetchingNextPage ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" />
                  Loading… {bookmarks.length}
                  {dbCounts ? ` of ${dbCounts.total}` : ""} loaded
                </span>
              ) : (
                <span>
                  {filteredBookmarks.length}
                  {activeCategory !== "all" || searchQuery
                    ? " filtered"
                    : ""}{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {dbCounts?.total ?? bookmarks.length}
                  </span>{" "}
                  total in Supabase
                </span>
              )}
            </span>
            {hasNextPage && !isFetchingNextPage && (
              <span className="text-[10px] text-amber-500">Fetching more…</span>
            )}
          </div>

          {/* Cards Grid OR Clean Empty Workspace Banner */}
          {bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <Boxes className="size-7" />
              </div>
              <h3 className="text-base font-bold tracking-tight text-foreground">
                Workspace is empty (0 records)
              </h3>
              <p className="max-w-md text-xs text-muted-foreground">
                All data has been cleared. Add your first post from X,
                Instagram, YouTube, TikTok, or import CSV, Excel (.xlsx), or
                JSON files using the section above to populate your workspace
                from 0!
              </p>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Search className="size-7" />
              </div>
              <h3 className="text-base font-bold tracking-tight text-foreground">
                No results found
              </h3>
              <p className="max-w-md text-xs text-muted-foreground">
                Try a different search term or category filter.
              </p>
            </div>
          ) : (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-3",
              )}
            >
              {displayItems.map((item) => (
                <BookmarkCardItem
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.has(item.id)}
                  currentCategoryIcon={currentCategoryObj.icon}
                  onToggleSelect={toggleSelectBookmark}
                  onOpenEmbed={handleOpenEmbed}
                  onSingleDelete={handleSingleDelete}
                  onSingleCategoryChange={handleSingleCategoryChange}
                />
              ))}
            </div>
          )}

          {/* Infinite Scroll Sentinel */}
          <div ref={scrollSentinelRef} className="h-4 w-full" />

          {/* Loading Indicator */}
          {(isFetchingNextPage || hasMoreClientPages) && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
        </main>
      </div>

      {/* 3. Floating Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-amber-500/40 bg-card/95 px-5 py-3 shadow-2xl backdrop-blur-xl duration-200 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 border-r border-border pr-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
              {selectedIds.size}
            </div>
            <span className="text-xs font-bold text-foreground">Selected</span>
          </div>

          {/* Select All / Deselect Toggle */}
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            {selectedIds.size === visibleBookmarks.length
              ? "Deselect All"
              : "Select All"}
          </button>

          {/* Move Category Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={isBulkProcessing}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
              >
                <FolderSync className="size-3.5" />
                <span>Move Category</span>
                <ChevronDown className="size-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="z-50 w-52">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Move {selectedIds.size} item{selectedIds.size > 1 ? "s" : ""}{" "}
                to:
              </div>
              <DropdownMenuSeparator />
              {CATEGORY_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => handleBulkCategoryChange(opt.tag, opt.name)}
                  className="flex cursor-pointer items-center gap-2.5 text-xs"
                >
                  {opt.icon}
                  <span>{opt.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Selected Button */}
          <button
            onClick={handleBulkDelete}
            disabled={isBulkProcessing}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
          >
            {isBulkProcessing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            <span>Delete Selected ({selectedIds.size})</span>
          </button>

          {/* Cancel Selection */}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Clear selection"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* 4. Live Interactive Embed Modal Dialog (Memoized - NO Reload on Scroll) */}
      {activeEmbedItem && (
        <EmbedModalDialog item={activeEmbedItem} onClose={handleCloseEmbed} />
      )}
    </div>
  );
}
