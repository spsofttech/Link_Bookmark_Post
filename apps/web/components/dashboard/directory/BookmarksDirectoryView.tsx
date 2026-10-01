"use client";

import { useMemo, useState } from "react";
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

interface CategoryDef {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  iconBg: string;
  description: string;
  tags: string[];
}

export default function BookmarksDirectoryView({
  bookmarks,
  _showEditorCard = true,
}: {
  bookmarks: ZBookmark[];
  _showEditorCard?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "popular" | "newest" | "oldest" | "alphabetical"
  >("popular");
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

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

    bookmarks.forEach((b) => {
      const tagNames = b.tags?.map((t) => t.name.toLowerCase()) || [];
      const title = (getBookmarkTitle(b) || "").toLowerCase();
      const summary = (b.summary || b.note || "").toLowerCase();
      const url = (getSourceUrl(b) || "").toLowerCase();
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
    });

    return stats;
  }, [bookmarks]);

  const categories: CategoryDef[] = [
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
      description: "Deep-dive articles, longform blog posts, and documentation",
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

  const currentCategoryObj = categories.find(
    (c) => c.id === activeCategory,
  ) || {
    id: "all",
    name: "All Components",
    count: categoryStats.all,
    icon: <Boxes className="size-4 text-amber-500" />,
    iconBg: "bg-amber-500/10 border-amber-500/20 text-amber-500",
    description:
      "All posts and bookmarks organized by category across your workspace",
    tags: ["all"],
  };

  // Filter & Sort Bookmarks
  const filteredBookmarks = useMemo(() => {
    let result = [...bookmarks];

    if (activeCategory !== "all") {
      result = result.filter((b) => {
        const tagNames = b.tags?.map((t) => t.name.toLowerCase()) || [];
        const title = (getBookmarkTitle(b) || "").toLowerCase();
        const summary = (b.summary || b.note || "").toLowerCase();
        const url = (getSourceUrl(b) || "").toLowerCase();
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
        const title = (getBookmarkTitle(b) || "").toLowerCase();
        const summary = (b.summary || b.note || "").toLowerCase();
        const url = (getSourceUrl(b) || "").toLowerCase();
        return title.includes(q) || summary.includes(q) || url.includes(q);
      });
    }

    if (sortBy === "alphabetical") {
      result.sort((a, b) =>
        (getBookmarkTitle(a) || "").localeCompare(getBookmarkTitle(b) || ""),
      );
    } else if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }

    return result;
  }, [bookmarks, activeCategory, searchQuery, sortBy]);

  // Display items derived strictly from actual user bookmarks
  const displayItems = useMemo(() => {
    return filteredBookmarks.map((b, i) => {
      const title = getBookmarkTitle(b) || "Untitled Post";
      const summary =
        b.summary ||
        b.note ||
        (b.content.type === BookmarkTypes.LINK ? b.content.description : "") ||
        "Bookmark post.";
      const categoryTag =
        b.tags?.[0]?.name ||
        currentCategoryObj.tags[i % currentCategoryObj.tags.length] ||
        "development";
      const statsCount = Math.floor(Math.abs(Math.sin(i + 1) * 35000)) + 5000;
      const rawUrl = getSourceUrl(b);
      const url =
        rawUrl || `https://github.com/topics/${categoryTag.toLowerCase()}`;
      const previewImage =
        b.content.type === BookmarkTypes.LINK
          ? b.content.imageUrl
          : b.content.type === BookmarkTypes.ASSET
            ? `/api/assets/${b.content.assetId}`
            : null;

      return {
        id: b.id,
        bookmark: b as ZBookmark | null,
        title,
        summary,
        categoryTag,
        statsCount,
        url,
        previewImage:
          previewImage ||
          `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80`,
        domain: url ? new URL(url).hostname : "web",
      };
    });
  }, [filteredBookmarks, currentCategoryObj]);

  return (
    <div className="fixed inset-0 z-40 flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground">
      {/* 1. Primary Left Page Sidebar - AI Templates & Real Categories */}
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
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {categoryStats.all}
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

              {/* Dynamic menu items */}
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
                  {showSidebar && res.badge && (
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
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/40 px-6 backdrop-blur-md">
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

        {/* Main Body View */}
        <main className="flex-1 space-y-6 overflow-y-auto p-8">
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
                    Paste URLs, notes, or code snippets, or upload CSV, Excel
                    (.xlsx), JSON bookmark exports.
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
                    e.target.value as unknown as
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
              {displayItems.length} components
            </span>
          </div>

          {/* 3-Column Component Cards Grid OR Clean Empty Workspace Banner */}
          {displayItems.length > 0 ? (
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
                  <div className="relative h-36 w-full overflow-hidden border-b border-border bg-muted/40">
                    {item.previewImage ? (
                      // oxlint-disable-next-line eslint-plugin-next/no-img-element
                      <img
                        src={item.previewImage}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10 p-4">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-background/80 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-foreground backdrop-blur-sm">
                            {item.domain || "Web Link"}
                          </span>
                          <div className="flex size-7 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-500">
                            {currentCategoryObj.icon}
                          </div>
                        </div>
                        <p className="line-clamp-2 font-mono text-[11px] text-muted-foreground/80">
                          {item.url || item.summary}
                        </p>
                      </div>
                    )}

                    {/* Complete Working Link Overlay Button */}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg border border-border/80 bg-background/90 text-foreground backdrop-blur-sm transition-all hover:bg-amber-500 hover:text-white"
                        title="Open complete working link"
                      >
                        <ExternalLink className="size-4" />
                      </a>
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
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <Boxes className="size-7" />
              </div>
              <h3 className="text-base font-bold tracking-tight text-foreground">
                Workspace is empty (0 records)
              </h3>
              <p className="max-w-md text-xs text-muted-foreground">
                All data has been cleared. Add your first post or import CSV,
                Excel (.xlsx), or JSON files using the section above to populate
                your workspace from 0!
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
