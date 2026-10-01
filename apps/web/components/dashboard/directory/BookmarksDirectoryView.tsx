"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  SlidersHorizontal,
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
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type { ZBookmark } from "@karakeep/shared/types/bookmarks";
import { BookmarkTypes } from "@karakeep/shared/types/bookmarks";
import {
  getBookmarkTitle,
  getSourceUrl,
} from "@karakeep/shared/utils/bookmarkUtils";
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
        ? `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`
        : null,
    };
  }

  if (lower.includes("twitter.com") || lower.includes("x.com")) {
    return {
      name: "X / Twitter",
      color: "bg-sky-500/10 text-sky-500 border-sky-500/20",
      type: "twitter",
      videoId: null,
      embedUrl: `https://twitframe.com/show?url=${encodeURIComponent(url)}`,
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
      embedUrl: url,
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
    return {
      name: "TikTok",
      color: "bg-pink-600/10 text-pink-600 border-pink-600/20",
      type: "tiktok",
      videoId: null,
      embedUrl: url,
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
        ? `https://player.vimeo.com/video/${vimeoMatch[1]}`
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

// ─── Single card transform (memoized per bookmark) ───────────────────────────
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
    bookmark: b as ZBookmark | null,
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
  const [sortBy, setSortBy] = useState<
    "popular" | "newest" | "oldest" | "alphabetical"
  >("popular");
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  // Client-side pagination (display chunks)
  const [displayPage, setDisplayPage] = useState<number>(1);

  // Active Embed Preview Modal State
  const [activeEmbedItem, setActiveEmbedItem] = useState<{
    title: string;
    url: string;
    platform: ReturnType<typeof getPlatformInfo>;
  } | null>(null);

  // Scroll sentinel ref for infinite scroll within the main area
  const scrollSentinelRef = useRef<HTMLDivElement | null>(null);
  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  // Real category counts calculation from actual user bookmarks
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

    return stats;
  }, [bookmarks]);

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

  // Filter & Sort (no per-item transform here yet - defer to display stage)
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

  // Items visible so far (client-side chunked render for performance)
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

  // Memoised transform for visible items only
  const displayItems = useMemo(
    () => visibleBookmarks.map((b, i) => transformBookmark(b, i)),
    [visibleBookmarks],
  );

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
                    {isFetchingNextPage && (
                      <Loader2 className="size-2.5 animate-spin" />
                    )}
                    {categoryStats.all}
                    {hasNextPage ? "+" : ""}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* BROWSE */}
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
          {/* ALWAYS VISIBLE Add Post & Import File Section */}
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

              {/* Filters Button */}
              <button className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span>Filters</span>
              </button>

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

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort by</span>
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
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:border-amber-500 focus:outline-none"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
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
                  Loading all data from Supabase… ({bookmarks.length} loaded so
                  far)
                </span>
              ) : (
                <span>
                  {filteredBookmarks.length} of {bookmarks.length} total
                  components
                  {activeCategory !== "all" || searchQuery ? " (filtered)" : ""}
                </span>
              )}
            </span>
            {hasNextPage && !isFetchingNextPage && (
              <span className="text-[10px] text-amber-500">
                Fetching more from database…
              </span>
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
                <div
                  key={item.id}
                  className={cn(
                    "shadow-xs group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200",
                    "hover:border-amber-500/70 hover:shadow-md dark:hover:border-amber-500/70",
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
                          const fallback =
                            target.nextElementSibling as HTMLElement | null;
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
                          {currentCategoryObj.icon}
                        </div>
                      </div>
                      <p className="line-clamp-2 font-mono text-[11px] text-muted-foreground">
                        {item.url || item.summary}
                      </p>
                    </div>

                    {/* Platform Badge Overlay on Image */}
                    {item.previewImage && (
                      <span
                        className={cn(
                          "shadow-xs absolute left-3 top-3 rounded-md border px-2 py-0.5 text-[10px] font-bold backdrop-blur-md",
                          item.platform.color,
                        )}
                      >
                        {item.platform.name}
                      </span>
                    )}

                    {/* Live Interactive Embed Button Overlay */}
                    {item.url && (
                      <button
                        onClick={() =>
                          setActiveEmbedItem({
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
                        {currentCategoryObj.icon}
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
                        <div className="opacity-0 transition-opacity group-hover:opacity-100">
                          <BookmarkOptions bookmark={item.bookmark} />
                        </div>
                      )}
                    </div>

                    {/* Card Description */}
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {item.summary}
                    </p>
                  </div>

                  {/* Bottom Bar: Tag + Stats + Complete Working Link */}
                  <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {item.categoryTag}
                      </span>

                      <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Download className="size-2.5" />
                        <span>{item.statsCount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Complete Working Link Action */}
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-mono text-[11px] font-semibold text-amber-600 transition-colors hover:underline dark:text-amber-400"
                      >
                        <span className="max-w-[130px] truncate">
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

      {/* 3. Live Interactive Embed Modal Dialog */}
      {activeEmbedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
          <div className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            {/* Modal Header */}
            <div className="flex h-14 items-center justify-between border-b border-border bg-card px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-xs font-semibold",
                    activeEmbedItem.platform.color,
                  )}
                >
                  {activeEmbedItem.platform.name}
                </span>
                <h3 className="line-clamp-1 text-sm font-bold text-foreground">
                  {activeEmbedItem.title}
                </h3>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={activeEmbedItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <span>Open Original Link</span>
                  <ExternalLink className="size-3.5" />
                </a>
                <button
                  onClick={() => setActiveEmbedItem(null)}
                  className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Live Embed Frame */}
            <div className="relative flex-1 bg-black/90">
              {activeEmbedItem.platform.type === "youtube" &&
              activeEmbedItem.platform.embedUrl ? (
                <iframe
                  src={activeEmbedItem.platform.embedUrl}
                  title={activeEmbedItem.title}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeEmbedItem.platform.type === "vimeo" &&
                activeEmbedItem.platform.embedUrl ? (
                <iframe
                  src={activeEmbedItem.platform.embedUrl}
                  title={activeEmbedItem.title}
                  className="h-full w-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : activeEmbedItem.platform.type === "twitter" &&
                activeEmbedItem.platform.embedUrl ? (
                <iframe
                  src={activeEmbedItem.platform.embedUrl}
                  title={activeEmbedItem.title}
                  className="h-full w-full border-0 bg-white"
                />
              ) : activeEmbedItem.platform.type === "instagram" &&
                activeEmbedItem.platform.embedUrl ? (
                <iframe
                  src={activeEmbedItem.platform.embedUrl}
                  title={activeEmbedItem.title}
                  className="h-full w-full border-0 bg-white"
                />
              ) : activeEmbedItem.platform.type === "reddit" ||
                activeEmbedItem.platform.type === "github" ? (
                <iframe
                  src={activeEmbedItem.url}
                  title={activeEmbedItem.title}
                  className="h-full w-full border-0 bg-white"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                  <div className="text-center">
                    <p className="mb-2 text-sm text-muted-foreground">
                      Direct embedding is not supported for this platform.
                    </p>
                    <a
                      href={activeEmbedItem.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                    >
                      <ExternalLink className="size-4" />
                      Open in New Tab
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
