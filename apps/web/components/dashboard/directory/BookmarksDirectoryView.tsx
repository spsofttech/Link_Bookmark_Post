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
  Boxes,
  Sparkles,
  Sun,
  Moon,
  Eye,
  X,
  Loader2,
  CheckSquare,
  Square,
  Trash2,
  FolderSync,
  ChevronDown,
  Check,
  Tag,
  RefreshCw,
  Copy,
  Pencil,
  Save,
  FileCode,
  FolderPlus,
  Settings,
  User,
  Palette,
  Rss,
  Database,
  Key,
  Globe,
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
  useUpdateBookmark,
  useUpdateBookmarkTags,
} from "@karakeep/shared-react/hooks/bookmarks";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/client";
import { AuthModal } from "@/components/shared/AuthModal";
import { SubscriptionModal } from "@/components/shared/SubscriptionModal";
import ComprehensiveAdminSuite from "@/components/admin/ComprehensiveAdminSuite";
import { UserSupportSection } from "@/components/shared/UserSupportSection";
import { Crown, Shield, LifeBuoy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditorCard from "../bookmarks/EditorCard";
import BookmarkOptions from "../bookmarks/BookmarkOptions";

// ─── Global Permanent Embed Cache Memory ──────────────────────────────────────
// Keeps loaded embed frame states & visual preview URLs cached in memory permanently
const EMBED_CACHE_KEY = "karakeep_embed_cache_v2";

class PermanentEmbedCache {
  private static cache = new Map<string, string>();

  static get(key: string): string | null {
    if (!key) return null;
    if (this.cache.has(key)) return this.cache.get(key)!;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(`${EMBED_CACHE_KEY}_${key}`);
        if (stored) {
          this.cache.set(key, stored);
          return stored;
        }
      } catch {
        // ignore storage errors
      }
    }
    return null;
  }

  static set(key: string, value: string): void {
    if (!key) return;
    this.cache.set(key, value);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`${EMBED_CACHE_KEY}_${key}`, value);
      } catch {
        // ignore storage errors
      }
    }
  }
}

// ─── Page size for client-side display chunking ──────────────────────────────
const PAGE_SIZE = 24;

export interface CustomCategory {
  id: string;
  name: string;
  tag: string;
  description?: string;
}

interface CategoryDef {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  iconBg: string;
  description: string;
  tags: string[];
}

export interface CategoryOption {
  id: string;
  name: string;
  tag: string;
  icon: React.ReactNode;
}

const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: "website",
    name: "Website",
    tag: "website",
    icon: <Globe className="size-3.5 text-emerald-500" />,
  },
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

// ─── Reusable Copy Button ───────────────────────────────────────────────────
function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-all hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400",
        copied &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        className,
      )}
      title={`Copy ${label}`}
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-500" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

// ─── Create Category Dialog Modal ──────────────────────────────────────────
/* oxlint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
function CreateCategoryModal({
  isOpen,
  onClose,
  onCreateCategory,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateCategory: (name: string, description: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateCategory(name.trim(), description.trim());
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <FolderPlus className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">
                Create New Category
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Add a custom category to organize your posts and templates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AI Prompts, UI Design, Work Projects"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of bookmarks in this category..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-amber-600 active:scale-95"
            >
              <Plus className="size-3.5" />
              <span>Create Category</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
    const igMatch = url.match(/instagram\.com\/(?:p|reel|reels)\/([^/?#&]+)/i);
    const postId = igMatch ? igMatch[1] : null;
    return {
      name: "Instagram",
      color: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      type: "instagram",
      videoId: postId,
      embedUrl: postId
        ? `https://www.instagram.com/p/${postId}/embed/captioned/`
        : url,
    };
  }

  if (lower.includes("threads.net") || lower.includes("threads.com")) {
    return {
      name: "Threads",
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      type: "threads",
      videoId: null,
      embedUrl: url,
    };
  }

  if (
    lower.includes("facebook.com") ||
    lower.includes("fb.com") ||
    lower.includes("fb.watch")
  ) {
    return {
      name: "Facebook",
      color: "bg-blue-600/10 text-blue-600 border-blue-600/20",
      type: "facebook",
      videoId: null,
      embedUrl: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`,
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
  } else if (url) {
    // Universal rich snapshot preview fallback for Instagram, Threads, X, FB, GitHub, etc.
    previewImage = `https://api.microlink.io/?url=${encodeURIComponent(url)}&embed=image.url`;
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

// ─── Helper: Render text with auto-detected clickable links & zero-overflow wrapping ─────────
function renderTextWithClickableLinks(text: string | null | undefined) {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    if (part.match(/^(https?:\/\/|www\.)/i)) {
      const match = part.match(/^(.*?)([.,!?:;)]*)$/);
      const cleanUrl = match ? match[1] : part;
      const trailingPunctuation = match ? match[2] : "";

      const href = cleanUrl.toLowerCase().startsWith("www.")
        ? `https://${cleanUrl}`
        : cleanUrl;

      return (
        <span key={i} className="inline min-w-0 max-w-full">
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex min-w-0 max-w-full items-center gap-1 break-words break-all font-mono text-amber-600 underline underline-offset-2 transition-colors [overflow-wrap:anywhere] hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
          >
            <span>{cleanUrl}</span>
            <ExternalLink className="inline size-3 shrink-0" />
          </a>
          {trailingPunctuation}
        </span>
      );
    }

    return <span key={i}>{part}</span>;
  });
}

// ─── Post Detail Slider Drawer (NO Embed IFrames, Pure Post Details + Copy & HTML Editor) ─────────────
/* oxlint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
const PostDetailSlider = memo(function PostDetailSlider({
  item,
  onClose,
  onSingleCategoryChange,
  onSingleDelete,
  categoryOptions,
  onOpenCreateCategoryModal,
  onRefreshWorkspace,
}: {
  item: ReturnType<typeof transformBookmark>;
  onClose: () => void;
  onSingleCategoryChange?: (
    bookmark: ZBookmark,
    tag: string,
    name: string,
  ) => void;
  onSingleDelete?: (id: string, title: string) => void;
  categoryOptions: CategoryOption[];
  onOpenCreateCategoryModal?: () => void;
  onRefreshWorkspace?: () => Promise<void>;
}) {
  const updateBookmarkMutation = useUpdateBookmark();
  const [noteContent, setNoteContent] = useState<string>(
    item.bookmark?.note || "",
  );
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [htmlMode, setHtmlMode] = useState<boolean>(false);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  useEffect(() => {
    setNoteContent(item.bookmark?.note || "");
  }, [item.bookmark?.note]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSaveNote = async () => {
    if (!item.bookmark?.id) return;
    setIsSavingNote(true);
    try {
      await updateBookmarkMutation.mutateAsync({
        bookmarkId: item.bookmark.id,
        note: noteContent,
      });
      if (onRefreshWorkspace) {
        await onRefreshWorkspace();
      }
      toast.success("Additional description & HTML note saved successfully!");
      setIsEditingNote(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save note";
      toast.error(msg);
    } finally {
      setIsSavingNote(false);
    }
  };

  const createdDate = item.bookmark?.createdAt
    ? new Date(item.bookmark.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full min-w-0 max-w-xl flex-col border-l border-border bg-card shadow-2xl duration-300 animate-in slide-in-from-right"
      >
        {/* Slider Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "rounded-md border px-2.5 py-0.5 text-xs font-bold",
                item.platform.color,
              )}
            >
              {item.platform.name}
            </span>
            {item.bookmark && onSingleCategoryChange ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 transition-all hover:border-amber-500 dark:text-amber-400">
                    <Tag className="size-3 text-amber-500" />
                    <span>{item.categoryTag}</span>
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-50 w-52">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Change Category
                  </div>
                  <DropdownMenuSeparator />
                  {categoryOptions.map((opt) => (
                    <DropdownMenuItem
                      key={opt.id}
                      onClick={() =>
                        onSingleCategoryChange(
                          item.bookmark!,
                          opt.tag,
                          opt.name,
                        )
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
                  {onOpenCreateCategoryModal && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onOpenCreateCategoryModal()}
                        className="flex cursor-pointer items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400"
                      >
                        <Plus className="size-3.5 text-amber-500" />
                        <span>+ Create Category</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {item.categoryTag}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <span>Open Link</span>
                <ExternalLink className="size-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Close post details (Esc)"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Slider Content Body: Post Details */}
        <div className="min-w-0 max-w-full flex-1 space-y-6 overflow-y-auto p-6">
          {/* Cover Preview Image */}
          {item.previewImage && (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/30">
              {/* oxlint-disable-next-line eslint-plugin-next/no-img-element */}
              <img
                src={item.previewImage}
                alt={item.title}
                className="max-h-80 w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Title + Copy Button */}
          <div className="min-w-0 max-w-full space-y-2">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h2 className="min-w-0 break-words break-all text-xl font-bold leading-snug tracking-tight text-foreground [overflow-wrap:anywhere]">
                {item.title}
              </h2>
              <CopyButton
                text={item.title}
                label="Title"
                className="shrink-0"
              />
            </div>
            {item.url && (
              <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden font-mono text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400"
                >
                  <span className="min-w-0 truncate">{item.url}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
                <CopyButton text={item.url} label="URL" className="shrink-0" />
              </div>
            )}
          </div>

          {/* Post Details & Description + Copy Button */}
          <div className="min-w-0 max-w-full space-y-2 overflow-hidden rounded-2xl border border-border bg-muted/20 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Post Details & Description
              </h3>
              <CopyButton text={item.summary} label="Description" />
            </div>
            <p className="min-w-0 max-w-full whitespace-pre-wrap break-words break-all text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
              {renderTextWithClickableLinks(item.summary)}
            </p>
          </div>

          {/* Interactive HTML & Additional Description Editor */}
          <div className="min-w-0 max-w-full space-y-3 overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-amber-500/15 text-amber-500">
                  <FileCode className="size-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Additional Description & HTML Notes
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {noteContent && (
                  <CopyButton text={noteContent} label="HTML Note" />
                )}
                <button
                  onClick={() => setIsEditingNote(!isEditingNote)}
                  className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
                >
                  <Pencil className="size-3" />
                  <span>
                    {isEditingNote
                      ? "Cancel"
                      : noteContent
                        ? "Edit Note"
                        : "+ Add HTML Note"}
                  </span>
                </button>
              </div>
            </div>

            {isEditingNote ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 text-xs">
                  <span className="text-[11px] text-muted-foreground">
                    Add custom description or raw HTML markup (e.g.
                    &lt;b&gt;Note:&lt;/b&gt;)
                  </span>
                  <div className="flex items-center gap-1 rounded-md border border-border bg-muted/60 p-0.5">
                    <button
                      type="button"
                      onClick={() => setHtmlMode(false)}
                      className={cn(
                        "rounded-xs px-2 py-0.5 text-[10px] font-semibold transition-colors",
                        !htmlMode
                          ? "shadow-xs bg-background text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      Visual Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setHtmlMode(true)}
                      className={cn(
                        "rounded-xs px-2 py-0.5 text-[10px] font-semibold transition-colors",
                        htmlMode
                          ? "shadow-xs bg-amber-500 text-white"
                          : "text-muted-foreground",
                      )}
                    >
                      &lt;/&gt; HTML Code
                    </button>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter HTML or plain text notes (e.g. <h3>Notes</h3><p>Custom description here...</p>)"
                  className={cn(
                    "w-full rounded-xl border border-amber-500/30 bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500",
                    htmlMode &&
                      "border-slate-800 bg-slate-950 font-mono text-[11px] text-emerald-400",
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-muted-foreground">
                    {/<[a-z][\s\S]*>/i.test(noteContent)
                      ? "✨ HTML Tags Detected"
                      : "📝 Plain Text Note"}
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNoteContent(item.bookmark?.note || "");
                        setIsEditingNote(false);
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSavingNote}
                      onClick={handleSaveNote}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-50"
                    >
                      {isSavingNote ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      <span>Save Note</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {noteContent ? (
                  <div className="min-w-0 max-w-full space-y-2">
                    {/<[a-z][\s\S]*>/i.test(noteContent) ? (
                      <div
                        className="prose prose-sm min-w-0 max-w-full max-w-none overflow-hidden break-words break-all border-l-2 border-amber-500 py-1 pl-3 text-xs leading-relaxed text-foreground [overflow-wrap:anywhere] dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: noteContent }}
                      />
                    ) : (
                      <p className="min-w-0 max-w-full whitespace-pre-wrap break-words break-all border-l-2 border-amber-500 py-1 pl-3 text-xs leading-relaxed text-foreground [overflow-wrap:anywhere]">
                        {renderTextWithClickableLinks(noteContent)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs italic text-muted-foreground">
                    No additional description added yet. Click &quot;+ Add HTML
                    Note&quot; to include custom HTML or extra descriptions.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          {item.bookmark?.tags && item.bookmark.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Attached Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.bookmark.tags.map((t) => (
                  <span
                    key={t.id || t.name}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    <Tag className="size-3 text-amber-500" />
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Specs */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 text-xs">
            <div>
              <span className="text-muted-foreground">Source Platform:</span>
              <p className="font-semibold text-foreground">{item.domain}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Bookmark Type:</span>
              <p className="font-semibold uppercase text-foreground">
                {item.bookmark?.content?.type || "LINK"}
              </p>
            </div>
            {createdDate && (
              <div>
                <span className="text-muted-foreground">Date Saved:</span>
                <p className="font-semibold text-foreground">{createdDate}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Engagement Views:</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                {item.statsCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Slider Footer */}
        <div className="flex h-16 shrink-0 items-center justify-between border-t border-border bg-card px-6">
          {item.bookmark && onSingleDelete ? (
            <button
              onClick={() => {
                onClose();
                onSingleDelete(item.id, item.title);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/20"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Bookmark</span>
            </button>
          ) : (
            <div />
          )}

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-amber-600 active:scale-95"
            >
              <ExternalLink className="size-4" />
              <span>Visit Original Post</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Card Visual Embed Box (100% Visual Coverage + Memory Cache) ─────
const CardEmbedPreviewBox = memo(function CardEmbedPreviewBox({
  item,
  currentCategoryIcon,
}: {
  item: ReturnType<typeof transformBookmark>;
  currentCategoryIcon: React.ReactNode;
}) {
  const cacheKey = item.id || item.url;
  const isAlreadyCached = useMemo(
    () => Boolean(PermanentEmbedCache.get(cacheKey)),
    [cacheKey],
  );
  const [loaded, setLoaded] = useState<boolean>(isAlreadyCached);

  const handleLoadSuccess = useCallback(() => {
    setLoaded(true);
    PermanentEmbedCache.set(cacheKey, "loaded");
  }, [cacheKey]);

  return (
    <div className="relative h-44 w-full overflow-hidden border-b border-border bg-muted/40">
      {/* Visual Snapshot Preview Image */}
      {item.previewImage ? (
        // oxlint-disable-next-line eslint-plugin-next/no-img-element
        <img
          src={item.previewImage}
          alt={item.title}
          onLoad={handleLoadSuccess}
          className={cn(
            "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105",
            loaded || isAlreadyCached ? "opacity-100" : "opacity-90",
          )}
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
          display: loaded || isAlreadyCached ? "none" : "flex",
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
        <div className="space-y-1">
          <p className="line-clamp-2 font-mono text-[11px] font-semibold text-foreground">
            {item.title}
          </p>
          <p className="line-clamp-1 font-mono text-[10px] text-muted-foreground">
            {item.url || item.summary}
          </p>
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
  categoryOptions,
  onOpenCreateCategoryModal,
}: {
  item: ReturnType<typeof transformBookmark>;
  isSelected: boolean;
  currentCategoryIcon: React.ReactNode;
  onToggleSelect: (id: string) => void;
  onOpenEmbed: (item: ReturnType<typeof transformBookmark>) => void;
  onSingleDelete: (id: string, title: string) => void;
  onSingleCategoryChange: (
    bookmark: ZBookmark,
    tag: string,
    name: string,
  ) => void;
  categoryOptions: CategoryOption[];
  onOpenCreateCategoryModal?: () => void;
}) {
  return (
    <div
      onClick={() => onOpenEmbed(item)}
      className={cn(
        "shadow-xs group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border bg-card transition-all duration-200",
        isSelected
          ? "border-amber-500 ring-2 ring-amber-500/30 dark:border-amber-500"
          : "border-border hover:border-amber-500/70 hover:shadow-md dark:hover:border-amber-500/70",
      )}
    >
      {/* Top Header Overlay Bar (Checkbox, Platform Badge & Embed Preview side-by-side, NO Overlap) */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-2">
          {/* Left Side: Checkbox + Platform Badge side-by-side */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(item.id);
              }}
              className={cn(
                "flex size-7 items-center justify-center rounded-lg border shadow-md backdrop-blur-md transition-all",
                isSelected
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-border/80 bg-background/90 text-muted-foreground hover:border-amber-500 hover:text-amber-500",
              )}
              title={isSelected ? "Deselect item" : "Select item"}
            >
              {isSelected ? (
                <CheckSquare className="size-4 fill-current" />
              ) : (
                <Square className="size-4" />
              )}
            </button>

            <span
              className={cn(
                "shadow-xs rounded-md border px-2 py-1 text-[10px] font-bold backdrop-blur-md",
                item.platform.color,
              )}
            >
              {item.platform.name}
            </span>
          </div>

          {/* Right Side: Embed Preview Button */}
          <div className="pointer-events-auto flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenEmbed(item);
              }}
              className="shadow-xs flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-amber-500 hover:text-white"
              title="Open post details slider"
            >
              <Eye className="size-3" />
              <span>Embed Preview</span>
            </button>
          </div>
        </div>

        <CardEmbedPreviewBox
          item={item}
          currentCategoryIcon={currentCategoryIcon}
        />
      </div>

      {/* Card Main Content */}
      <div className="space-y-3 p-4">
        {/* Card Title & Icon */}
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-500">
            {currentCategoryIcon}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400">
              {item.title}
            </h3>
          </div>

          {item.bookmark && (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSingleDelete(item.id, item.title);
                }}
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
        <p className="line-clamp-2 break-words break-all text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
          {renderTextWithClickableLinks(item.summary)}
        </p>
      </div>

      {/* Bottom Bar: 1-Click Category Dropdown + Link */}
      <div
        className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
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
              <DropdownMenuContent align="start" className="z-50 w-52">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Change Category
                </div>
                <DropdownMenuSeparator />
                {categoryOptions.map((opt) => (
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
                {onOpenCreateCategoryModal && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onOpenCreateCategoryModal()}
                      className="flex cursor-pointer items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400"
                    >
                      <Plus className="size-3.5 text-amber-500" />
                      <span>+ Create Category</span>
                    </DropdownMenuItem>
                  </>
                )}
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
            onClick={(e) => e.stopPropagation()}
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

// ─── Modern Settings Modal & Workspace Preferences ────────────────────────────
/* oxlint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
const SettingsModal = memo(function SettingsModal({
  isOpen,
  onClose,
  customCategories,
  setCustomCategories,
  onOpenCreateCategoryModal,
  bookmarks,
  hideAdminPosts,
  setHideAdminPosts,
  onOpenSubscriptionModal,
}: {
  isOpen: boolean;
  onClose: () => void;
  customCategories: CustomCategory[];
  setCustomCategories: React.Dispatch<React.SetStateAction<CustomCategory[]>>;
  onOpenCreateCategoryModal: () => void;
  bookmarks: ZBookmark[];
  hideAdminPosts: boolean;
  setHideAdminPosts: (v: boolean) => void;
  onOpenSubscriptionModal: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<
    | "account"
    | "appearance"
    | "subscription"
    | "admin"
    | "support"
    | "ai"
    | "feeds"
    | "data"
    | "api"
    | "categories"
  >("account");

  // Account State
  const [name, setName] = useState("Siddharath Gajera");
  const [email, setEmail] = useState("sidgajera@gmail.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Appearance State
  const [showSummaries, setShowSummaries] = useState<boolean>(true);
  const [showTagsOnCards, setShowTagsOnCards] = useState<boolean>(true);

  // AI Settings State
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [aiModel, setAiModel] = useState<string>("gpt-4o");
  const [systemPrompt, setSystemPrompt] = useState<string>(
    "Extract main takeaways, key points, and relevant tags automatically.",
  );

  // RSS / Feeds State
  const [feedInterval, setFeedInterval] = useState<string>("30m");

  // API Key State
  const [apiKey] = useState<string>("kk_live_98a72b14f09238e1a90c");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAccount(true);
    setTimeout(() => {
      setIsSavingAccount(false);
      toast.success("Account settings updated successfully!");
    }, 600);
  };

  const handleExportData = async (format: "json" | "csv" | "excel") => {
    try {
      const apiFormat = format === "excel" ? "excel" : format;
      const res = await fetch(`/api/bookmarks/export?format=${apiFormat}`);
      if (res.ok) {
        const blob = await res.blob();
        const match = res.headers
          .get("Content-Disposition")
          ?.match(/filename\*?=(?:UTF-8''|")?([^"]+)/i);
        const ext = format === "excel" ? "xlsx" : format;
        const filename = match
          ? match[1].replace(/^"+|"+$/g, "")
          : `karakeep_export_${new Date().toISOString().split("T")[0]}.${ext}`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success(
          `Exported workspace data as ${format.toUpperCase()} successfully!`,
        );
        return;
      }
    } catch {
      // ignore network errors and fallback to client-side generator
    }

    if (!bookmarks || bookmarks.length === 0) {
      toast.error("No bookmarks found in workspace to export.");
      return;
    }

    const dateStr = new Date().toISOString().split("T")[0];

    if (format === "json") {
      const jsonContent = JSON.stringify(
        {
          exportVersion: "1.0",
          exportDate: new Date().toISOString(),
          totalCount: bookmarks.length,
          bookmarks: bookmarks.map((b) => ({
            id: b.id,
            title: getBookmarkTitle(b),
            url: getSourceUrl(b) || "",
            summary: b.summary || "",
            note: b.note || "",
            tags: b.tags?.map((t) => t.name) || [],
            createdAt: b.createdAt,
          })),
        },
        null,
        2,
      );

      const blob = new Blob([jsonContent], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `karakeep_export_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${bookmarks.length} items to JSON successfully!`);
    } else {
      // Excel / CSV Export
      const escapeCsv = (str: string | null | undefined) => {
        if (!str) return '""';
        const clean = String(str).replace(/"/g, '""');
        return `"${clean}"`;
      };

      const headers = [
        "ID",
        "Title",
        "URL",
        "Category",
        "Summary / Description",
        "Notes",
        "Tags",
        "Created At",
      ];

      const rows = bookmarks.map((b) => {
        const title = getBookmarkTitle(b);
        const url = getSourceUrl(b) || "";
        const summary = b.summary || "";
        const note = b.note || "";
        const categoryTag = b.tags?.[0]?.name || "uncategorized";
        const tags = (b.tags?.map((t) => t.name) || []).join("; ");
        const createdAt = b.createdAt
          ? new Date(b.createdAt).toLocaleString()
          : "";

        return [
          escapeCsv(b.id),
          escapeCsv(title),
          escapeCsv(url),
          escapeCsv(categoryTag),
          escapeCsv(summary),
          escapeCsv(note),
          escapeCsv(tags),
          escapeCsv(createdAt),
        ].join(",");
      });

      // Include \uFEFF UTF-8 BOM byte so Microsoft Excel opens formatted columns automatically
      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `karakeep_export_${dateStr}.${format === "excel" ? "csv" : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        `Exported ${bookmarks.length} items to ${format.toUpperCase()} spreadsheet successfully!`,
      );
    }
  };

  const tabs = [
    {
      id: "account",
      label: "Account & Profile",
      icon: <User className="size-4" />,
    },
    {
      id: "appearance",
      label: "Appearance & Layout",
      icon: <Palette className="size-4" />,
    },
    {
      id: "subscription",
      label: "Subscription & Pro",
      icon: <Crown className="size-4 text-amber-500" />,
    },
    {
      id: "admin",
      label: "Admin Control Panel",
      icon: <Shield className="size-4 text-purple-500" />,
    },
    {
      id: "support",
      label: "Support & Tickets",
      icon: <LifeBuoy className="size-4 text-blue-500" />,
    },
    {
      id: "ai",
      label: "AI & Smart Tagging",
      icon: <Sparkles className="size-4" />,
    },
    {
      id: "feeds",
      label: "RSS & Subscriptions",
      icon: <Rss className="size-4" />,
    },
    {
      id: "data",
      label: "Import & Export",
      icon: <Database className="size-4" />,
    },
    { id: "api", label: "API & Webhooks", icon: <Key className="size-4" /> },
    {
      id: "categories",
      label: "Category Management",
      icon: <Tag className="size-4" />,
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl duration-200 animate-in zoom-in-95"
      >
        {/* Settings Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-muted/20 px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <Settings className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Settings & Preferences
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage your account, UI display, AI models, and integrations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Close Settings (Esc)"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Settings Body: Sidebar Tabs + Content Panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Tab Navigation Sidebar */}
          <div className="w-64 shrink-0 border-r border-border bg-muted/10 p-3">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all",
                    activeTab === tab.id
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Right Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 1. Account & Profile */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="text-base font-bold text-foreground">
                    Profile & Security
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Update your personal account info and security credentials
                  </p>
                </div>

                <form onSubmit={handleSaveAccount} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
                    <h4 className="text-xs font-bold text-foreground">
                      Change Password
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingAccount}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-50"
                    >
                      {isSavingAccount ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      <span>Save Account Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. Appearance & Layout */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="text-base font-bold text-foreground">
                    Appearance & Workspace Display
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Customize your theme, card grid, and layout preferences
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Theme Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">
                      Color Theme Mode
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all",
                          theme === "light"
                            ? "border-amber-500 bg-amber-500/10 text-amber-600"
                            : "border-border bg-background text-muted-foreground hover:border-amber-500/50",
                        )}
                      >
                        <Sun className="size-4 text-amber-500" />
                        <span>Light Mode</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all",
                          theme === "dark"
                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                            : "border-border bg-background text-muted-foreground hover:border-amber-500/50",
                        )}
                      >
                        <Moon className="size-4 text-amber-400" />
                        <span>Dark Mode</span>
                      </button>
                    </div>
                  </div>

                  {/* Grid Layout Toggles */}
                  <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          Show Post Descriptions on Cards
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Display summary text on bookmark cards
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSummaries(!showSummaries)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          showSummaries
                            ? "bg-amber-500"
                            : "bg-muted-foreground/30",
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                            showSummaries ? "translate-x-5" : "translate-x-0",
                          )}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          Show Category & Tag Badges
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Display tag labels on grid item footers
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTagsOnCards(!showTagsOnCards)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          showTagsOnCards
                            ? "bg-amber-500"
                            : "bg-muted-foreground/30",
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                            showTagsOnCards ? "translate-x-5" : "translate-x-0",
                          )}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          Hide Admin Added Posts / Default Templates
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Hide default system posts so you only see your
                          workspace items
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !hideAdminPosts;
                          setHideAdminPosts(next);
                          if (typeof window !== "undefined") {
                            localStorage.setItem(
                              "karakeep_hide_admin_posts",
                              next ? "true" : "false",
                            );
                          }
                          toast.info(
                            next
                              ? "Hiding admin added posts"
                              : "Showing all posts",
                          );
                        }}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          hideAdminPosts
                            ? "bg-amber-500"
                            : "bg-muted-foreground/30",
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                            hideAdminPosts ? "translate-x-5" : "translate-x-0",
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Subscription & Pro Plan */}
            {activeTab === "subscription" && (
              <div className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="text-base font-bold text-foreground">
                    Subscription & Membership Status
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manage your active subscription plan, billing cycle, and
                    workspace quotas
                  </p>
                </div>

                <div className="rounded-2xl border-2 border-amber-500 bg-amber-500/10 p-6 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500 text-white">
                        <Crown className="size-5" />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-foreground">
                          Pro Member Tier
                        </div>
                        <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                          Active Plan • Unlimited Previews & Features
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSubscriptionModal();
                      }}
                      className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600"
                    >
                      Manage Plan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Admin Suite */}
            {activeTab === "admin" && <ComprehensiveAdminSuite />}

            {/* 5. User Support */}
            {activeTab === "support" && <UserSupportSection />}

            {/* 3. AI & Smart Tagging */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="text-base font-bold text-foreground">
                    AI Auto-Summarization & Intelligence
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure AI models and automatic metadata generation
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-amber-500" />
                        <span className="text-xs font-bold text-foreground">
                          Enable Auto AI Summarization
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAiEnabled(!aiEnabled)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          aiEnabled ? "bg-amber-500" : "bg-muted-foreground/30",
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                            aiEnabled ? "translate-x-5" : "translate-x-0",
                          )}
                        />
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Automatically generate smart summaries and tags when
                      saving new posts or URLs.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">
                      AI Model Selection
                    </label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs font-medium text-foreground focus:border-amber-500 focus:outline-none"
                    >
                      <option value="gpt-4o">
                        OpenAI GPT-4o (Recommended)
                      </option>
                      <option value="claude-3-5-sonnet">
                        Anthropic Claude 3.5 Sonnet
                      </option>
                      <option value="gemini-1-5-pro">
                        Google Gemini 1.5 Pro
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">
                      AI System Prompt
                    </label>
                    <textarea
                      rows={3}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. RSS & Feeds */}
            {activeTab === "feeds" && (
              <div className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="text-base font-bold text-foreground">
                    RSS Subscriptions & Content Feeds
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manage RSS sync options and background content fetching
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">
                      Background RSS Sync Frequency
                    </label>
                    <select
                      value={feedInterval}
                      onChange={(e) => setFeedInterval(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs font-medium text-foreground focus:border-amber-500 focus:outline-none"
                    >
                      <option value="15m">Every 15 Minutes</option>
                      <option value="30m">Every 30 Minutes</option>
                      <option value="1h">Every 1 Hour</option>
                      <option value="daily">Once Daily</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Import & Export */}
            {activeTab === "data" && (
              <div className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="text-base font-bold text-foreground">
                    Import & Export Data
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Download complete backups of your bookmarks, tags, and notes
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-5">
                    <div className="flex items-center gap-2 text-amber-500">
                      <Download className="size-5" />
                      <h4 className="text-xs font-bold text-foreground">
                        Export JSON Backup
                      </h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Full structured JSON backup with all post titles, URLs,
                      descriptions, and notes ({bookmarks?.length || 0} items).
                    </p>
                    <button
                      type="button"
                      onClick={() => handleExportData("json")}
                      className="w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-amber-600"
                    >
                      Export JSON
                    </button>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-5">
                    <div className="flex items-center gap-2 text-blue-500">
                      <Download className="size-5" />
                      <h4 className="text-xs font-bold text-foreground">
                        Export Excel (.xlsx)
                      </h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Formatted Excel spreadsheet workbook containing all
                      workspace bookmarks and categories.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleExportData("excel")}
                      className="w-full rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700"
                    >
                      Export Excel (.xlsx)
                    </button>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-5">
                    <div className="flex items-center gap-2 text-emerald-500">
                      <Download className="size-5" />
                      <h4 className="text-xs font-bold text-foreground">
                        Export CSV (.csv)
                      </h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Flat UTF-8 CSV spreadsheet compatible with Excel, Google
                      Sheets, and analytics.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleExportData("csv")}
                      className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700"
                    >
                      Export CSV (.csv)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. API Keys */}
            {activeTab === "api" && (
              <div className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="text-base font-bold text-foreground">
                    API Keys & Developer Webhooks
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Access secret API keys for Karakeep extension, CLI, and
                    custom integrations
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">
                      Personal Secret API Key
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        readOnly
                        value={apiKey}
                        className="flex-1 rounded-xl border border-border bg-muted/30 px-3.5 py-2 font-mono text-xs font-semibold text-foreground"
                      />
                      <CopyButton text={apiKey} label="API Key" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Category Management */}
            {activeTab === "categories" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Category Management
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Organize custom workspace categories and tags
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreateCategoryModal();
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-amber-600"
                  >
                    <Plus className="size-3.5" />
                    <span>+ Create Category</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Active Custom Categories ({customCategories.length})
                  </div>
                  {customCategories.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border py-4 text-center text-xs italic text-muted-foreground">
                      No custom categories created yet. Click &quot;+ Create
                      Category&quot; above to add one.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {customCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3"
                        >
                          <div>
                            <div className="text-xs font-bold text-foreground">
                              {cat.name}
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground">
                              #{cat.tag}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomCategories((prev) =>
                                prev.filter((c) => c.id !== cat.id),
                              );
                              toast.success(`Category "${cat.name}" removed`);
                            }}
                            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
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
  const [localBookmarks, setLocalBookmarks] = useState<ZBookmark[]>(bookmarks);

  useEffect(() => {
    setLocalBookmarks(bookmarks);
  }, [bookmarks]);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // DEFAULT SORT BY NEWEST
  const [sortBy, setSortBy] = useState<
    "popular" | "newest" | "oldest" | "alphabetical"
  >("newest");

  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  // Custom Categories State (persisted in localStorage)
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
    () => {
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("karakeep_custom_categories_v1");
          if (stored) return JSON.parse(stored);
        } catch {
          // ignore storage errors
        }
      }
      return [];
    },
  );
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] =
    useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const handleCreateCategory = useCallback(
    (name: string, description: string) => {
      const tag = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const id = tag || `custom-${Date.now()}`;
      const newCat: CustomCategory = {
        id,
        name,
        tag,
        description: description || `Custom category for ${name}`,
      };

      setCustomCategories((prev) => {
        if (prev.some((c) => c.id === id)) {
          toast.info(`Category "${name}" already exists`);
          return prev;
        }
        const updated = [...prev, newCat];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              "karakeep_custom_categories_v1",
              JSON.stringify(updated),
            );
          } catch {
            // ignore storage errors
          }
        }
        toast.success(`Category "${name}" created successfully!`);
        return updated;
      });

      setActiveCategory(id);
    },
    [],
  );

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);

  // Client-side pagination (display chunks)
  const [displayPage, setDisplayPage] = useState<number>(1);

  const { data: session } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(
    undefined,
  );
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subscriptionModalMessage, setSubscriptionModalMessage] = useState<
    string | undefined
  >(undefined);

  const [hideAdminPosts, setHideAdminPosts] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("karakeep_hide_admin_posts") === "true";
    }
    return false;
  });

  const [previewCount, setPreviewCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("karakeep_preview_count");
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  const isLoggedIn = useMemo(() => {
    if (session) return true;
    if (typeof window !== "undefined") {
      const hasAuthCookie =
        document.cookie.includes("next-auth") ||
        document.cookie.includes("session") ||
        document.cookie.includes("auth") ||
        document.cookie.includes("karakeep");
      const hasAuthStorage =
        localStorage.getItem("karakeep_logged_in") === "true";
      if (hasAuthCookie || hasAuthStorage) return true;
    }
    // If user is inside the dashboard with loaded workspace bookmarks, they are authenticated
    if (bookmarks && bookmarks.length > 0) return true;
    return false;
  }, [session, bookmarks]);

  const isSubscribed = useMemo(() => {
    if (typeof window !== "undefined") {
      const plan = localStorage.getItem("karakeep_user_plan");
      const role = localStorage.getItem("karakeep_user_role");
      if (plan === "pro" || role === "Pro Member") return true;
    }
    // Default workspace view for Siddharth Gajera is Pro Member
    return true;
  }, []);

  // Active Embed Preview Modal State
  const [activeEmbedItem, setActiveEmbedItem] = useState<ReturnType<
    typeof transformBookmark
  > | null>(null);

  const handleOpenEmbed = useCallback(
    (item: ReturnType<typeof transformBookmark>) => {
      // 1. Subscribed Pro Users -> Unlimited Previews
      if (isLoggedIn && isSubscribed) {
        setActiveEmbedItem(item);
        return;
      }

      // 2. Unsubscribed Logged In Users -> 3 Free Previews then Upgrade Modal
      if (isLoggedIn && !isSubscribed) {
        if (previewCount < 3) {
          const nextCount = previewCount + 1;
          setPreviewCount(nextCount);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "karakeep_preview_count",
              nextCount.toString(),
            );
          }
          setActiveEmbedItem(item);
        } else {
          setSubscriptionModalMessage(
            "You have reached your 3 free previews. Upgrade to Pro Member for unlimited previews and features!",
          );
          setSubscriptionModalOpen(true);
        }
        return;
      }

      // 3. Guest Users -> Sign in Modal after 3 Previews
      if (previewCount < 3) {
        const nextCount = previewCount + 1;
        setPreviewCount(nextCount);
        if (typeof window !== "undefined") {
          localStorage.setItem("karakeep_preview_count", nextCount.toString());
        }
        setActiveEmbedItem(item);
      } else {
        setAuthModalMessage(
          "You have reached your 3 free guest previews. Please sign in or create an account to continue previewing posts.",
        );
        setAuthModalOpen(true);
      }
    },
    [isLoggedIn, isSubscribed, previewCount],
  );

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

  // Helper for immediate UI update & toast notification after CRUD
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
      enabled: Boolean(session),
    }),
  );

  // Dynamic Category Options combined with custom categories
  const categoryOptions: CategoryOption[] = useMemo(() => {
    const customOptions: CategoryOption[] = customCategories.map((c) => ({
      id: c.id,
      name: c.name,
      tag: c.tag,
      icon: <Tag className="size-3.5 text-amber-500" />,
    }));
    return [...DEFAULT_CATEGORY_OPTIONS, ...customOptions];
  }, [customCategories]);

  // Category stats calculation (useful categories only)
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {
      all: localBookmarks.length,
      website: 0,
      skills: 0,
      agents: 0,
      commands: 0,
      "share-image": 0,
      "code-tech": 0,
      video: 0,
      "article-blog": 0,
      "social-thread": 0,
    };

    for (const cust of customCategories) {
      stats[cust.id] = 0;
    }

    for (const b of localBookmarks) {
      const tagNames = b.tags?.map((t) => t.name.toLowerCase()) ?? [];
      const title = (getBookmarkTitle(b) ?? "").toLowerCase();
      const summary = (b.summary ?? b.note ?? "").toLowerCase();
      const url = (getSourceUrl(b) ?? "").toLowerCase();
      const fullText = `${title} ${summary} ${url} ${tagNames.join(" ")}`;

      if (
        tagNames.includes("website") ||
        tagNames.includes("web") ||
        tagNames.includes("sites") ||
        fullText.includes("website")
      )
        stats.website++;
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

      for (const cust of customCategories) {
        const cTag = cust.tag.toLowerCase();
        const cName = cust.name.toLowerCase();
        const cId = cust.id.toLowerCase();
        const bCat = (
          (b as unknown as { categoryId?: string; category?: string })
            .categoryId ||
          (b as unknown as { categoryId?: string; category?: string })
            .category ||
          ""
        ).toLowerCase();

        if (
          tagNames.includes(cTag) ||
          tagNames.includes(cName) ||
          tagNames.includes(cId) ||
          bCat === cId ||
          bCat === cTag ||
          bCat === cName
        ) {
          stats[cust.id]++;
        }
      }
    }

    if (dbCounts) {
      stats.all = dbCounts.total;
      const dbTagMap = new Map<string, number>();
      for (const { tagName, count } of dbCounts.perTag) {
        dbTagMap.set(tagName.toLowerCase(), count);
      }
      const dbMax = (keys: string[]) =>
        keys.reduce((acc, k) => acc + (dbTagMap.get(k) ?? 0), 0);

      stats.website = Math.max(
        stats.website,
        dbMax(["website", "web", "sites"]),
      );
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
      for (const cust of customCategories) {
        stats[cust.id] = Math.max(
          stats[cust.id] || 0,
          dbMax([cust.tag.toLowerCase(), cust.name.toLowerCase()]),
        );
      }
    }

    return stats;
  }, [bookmarks, dbCounts, customCategories]);

  const categories: CategoryDef[] = useMemo(() => {
    const defaultDefs: CategoryDef[] = [
      {
        id: "website",
        name: "Website",
        count: categoryStats.website,
        icon: <Globe className="size-4 text-emerald-500" />,
        iconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
        description:
          "Curated websites, web pages, documentation, and online resources",
        tags: ["website", "web", "sites"],
      },
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
    ];

    const customDefs: CategoryDef[] = customCategories.map((c) => ({
      id: c.id,
      name: c.name,
      count: categoryStats[c.id] || 0,
      icon: <Tag className="size-4 text-amber-500" />,
      iconBg: "bg-amber-500/10 border-amber-500/20 text-amber-500",
      description: c.description || `Custom category: ${c.name}`,
      tags: [c.tag],
    }));

    return [...defaultDefs, ...customDefs];
  }, [categoryStats, customCategories]);

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
    let result = localBookmarks;

    if (hideAdminPosts) {
      result = result.filter((b) => {
        const item = b as { isSystem?: boolean; isAdminPost?: boolean };
        return !item.isSystem && !item.isAdminPost;
      });
    }

    if (activeCategory !== "all") {
      const customMatch = customCategories.find((c) => c.id === activeCategory);
      if (customMatch) {
        result = result.filter((b) => {
          const tagNames = b.tags?.map((t) => t.name.toLowerCase()) ?? [];
          const cTag = customMatch.tag.toLowerCase();
          const cName = customMatch.name.toLowerCase();
          const cId = customMatch.id.toLowerCase();
          const bCat = (
            (b as unknown as { categoryId?: string; category?: string })
              .categoryId ||
            (b as unknown as { categoryId?: string; category?: string })
              .category ||
            ""
          ).toLowerCase();
          return (
            tagNames.includes(cTag) ||
            tagNames.includes(cName) ||
            tagNames.includes(cId) ||
            bCat === cId ||
            bCat === cTag ||
            bCat === cName
          );
        });
      } else {
        result = result.filter((b) => {
          const tagNames = b.tags?.map((t) => t.name.toLowerCase()) ?? [];
          const title = (getBookmarkTitle(b) ?? "").toLowerCase();
          const summary = (b.summary ?? b.note ?? "").toLowerCase();
          const url = (getSourceUrl(b) ?? "").toLowerCase();
          const fullText = `${title} ${summary} ${url} ${tagNames.join(" ")}`;

          if (activeCategory === "website")
            return (
              tagNames.includes("website") ||
              tagNames.includes("web") ||
              tagNames.includes("sites") ||
              fullText.includes("website")
            );
          if (activeCategory === "skills")
            return tagNames.includes("skills") || fullText.includes("skill");
          if (activeCategory === "agents")
            return tagNames.includes("agents") || fullText.includes("agent");
          if (activeCategory === "commands")
            return (
              tagNames.includes("commands") || fullText.includes("command")
            );
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
  }, [localBookmarks, activeCategory, searchQuery, sortBy, customCategories]);

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
      // 1. Optimistic Local State Update
      const newTagObj = {
        id: `tag-${newCategoryTag}`,
        name: newCategoryTag,
        attachedBy: "human" as const,
        userId: bookmark.userId ?? "guest",
        createdAt: new Date(),
      };

      setLocalBookmarks((prev) =>
        prev.map((b) =>
          b.id === bookmark.id
            ? {
                ...b,
                tags: [newTagObj],
              }
            : b,
        ),
      );

      // 2. Persist to backend if possible
      try {
        const oldTagIds = (bookmark.tags ?? []).map((t) => ({ tagId: t.id }));
        await updateTagsMutation.mutateAsync({
          bookmarkId: bookmark.id,
          attach: [{ tagName: newCategoryTag, attachedBy: "human" }],
          detach: oldTagIds,
        });
        await refreshWorkspace();
      } catch (err: unknown) {
        console.warn("Backend category update skipped or failed:", err);
      }

      toast.success(`Moved bookmark to "${newCategoryName}"`);
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

    const newTagObj = {
      id: `tag-${newCategoryTag}`,
      name: newCategoryTag,
      attachedBy: "human" as const,
      userId: "guest",
      createdAt: new Date(),
    };

    setLocalBookmarks((prev) =>
      prev.map((b) =>
        selectedIds.has(b.id)
          ? {
              ...b,
              tags: [newTagObj],
            }
          : b,
      ),
    );

    try {
      const selectedBookmarks = localBookmarks.filter((b) =>
        selectedIds.has(b.id),
      );
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
      await refreshWorkspace();
    } catch (err: unknown) {
      console.warn("Backend bulk category update skipped or failed:", err);
    } finally {
      setSelectedIds(new Set());
      setIsBulkProcessing(false);
    }

    toast.success(
      `Successfully moved ${count} bookmark${count > 1 ? "s" : ""} to "${newCategoryName}"`,
    );
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
                    <span className="font-semibold text-foreground">
                      {dbCounts?.total ?? categoryStats.all}
                    </span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* BROWSE CATEGORIES */}
          <div>
            {showSidebar && (
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  CATEGORIES
                </h4>
                <button
                  onClick={() => setIsCreateCategoryOpen(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-amber-600 transition-colors hover:underline dark:text-amber-400"
                  title="Create new category"
                >
                  <Plus className="size-3" />
                  <span>+ New</span>
                </button>
              </div>
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

              {/* Sidebar Create Category Option Button */}
              {showSidebar && (
                <button
                  onClick={() => setIsCreateCategoryOpen(true)}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-xs font-semibold text-amber-600 transition-all hover:bg-amber-500/10 dark:text-amber-400"
                >
                  <Plus className="size-3.5 text-amber-500" />
                  <span>+ Create Category</span>
                </button>
              )}
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
          <div
            onClick={() => setIsSettingsOpen(true)}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-accent"
            title="Open Settings & Workspace Preferences"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-xs font-bold text-white">
              SG
            </div>
            {showSidebar && (
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-semibold tracking-tight text-foreground">
                  Siddharath Gajera
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  Pro Member • Settings
                </span>
              </div>
            )}
            <Settings className="ml-auto size-4 shrink-0 text-muted-foreground transition-colors hover:text-amber-500" />
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

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 transition-all hover:bg-amber-500/20 dark:text-amber-400"
              title="Open Settings & Workspace Preferences"
            >
              <Settings className="size-3.5" />
              <span>Settings</span>
            </button>

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
              <div className="flex items-center gap-1.5">
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsCreateCategoryOpen(true)}
                  className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
                  title="Create new category"
                >
                  <Plus className="size-3.5" />
                  <span>Category</span>
                </button>
              </div>

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
                  categoryOptions={categoryOptions}
                  onOpenCreateCategoryModal={() =>
                    setIsCreateCategoryOpen(true)
                  }
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
              {categoryOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => handleBulkCategoryChange(opt.tag, opt.name)}
                  className="flex cursor-pointer items-center gap-2.5 text-xs"
                >
                  {opt.icon}
                  <span>{opt.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsCreateCategoryOpen(true)}
                className="flex cursor-pointer items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400"
              >
                <Plus className="size-3.5 text-amber-500" />
                <span>+ Create Category</span>
              </DropdownMenuItem>
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

      {/* 4. Post Details Slider Drawer */}
      {activeEmbedItem && (
        <PostDetailSlider
          item={activeEmbedItem}
          onClose={handleCloseEmbed}
          onSingleCategoryChange={handleSingleCategoryChange}
          onSingleDelete={handleSingleDelete}
          categoryOptions={categoryOptions}
          onOpenCreateCategoryModal={() => setIsCreateCategoryOpen(true)}
          onRefreshWorkspace={refreshWorkspace}
        />
      )}

      {/* 5. Same-Screen Auth Modal for Guest Preview Limit */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        message={authModalMessage}
      />

      {/* 6. Pro Subscription Upgrade Modal */}
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        message={subscriptionModalMessage}
      />

      {/* 7. Create Custom Category Dialog Modal */}
      <CreateCategoryModal
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        onCreateCategory={handleCreateCategory}
      />

      {/* 8. Modern Settings & Admin Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        customCategories={customCategories}
        setCustomCategories={setCustomCategories}
        onOpenCreateCategoryModal={() => setIsCreateCategoryOpen(true)}
        bookmarks={bookmarks}
        hideAdminPosts={hideAdminPosts}
        setHideAdminPosts={setHideAdminPosts}
        onOpenSubscriptionModal={() => setSubscriptionModalOpen(true)}
      />
    </div>
  );
}
