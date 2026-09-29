"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Github, Globe, Instagram, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmbedInfo =
  | { type: "youtube"; embedUrl: string }
  | { type: "vimeo"; embedUrl: string }
  | { type: "instagram"; embedUrl: string }
  | { type: "instagram-profile"; embedUrl: string; username: string }
  | { type: "threads"; embedUrl: string; postId?: string }
  | { type: "spotify"; embedUrl: string }
  | { type: "google-docs"; embedUrl: string }
  | { type: "twitter"; embedUrl: string }
  | { type: "github"; embedUrl: string; owner: string; repo: string }
  | { type: "notion"; embedUrl: string; domain: string }
  | { type: "card"; embedUrl: string; domain: string }
  | { type: "iframe"; embedUrl: string };

function isFrameRestrictedHost(host: string, pathname: string): boolean {
  if (host.includes("linkedin.com")) return true;
  if (host.includes("medium.com")) return true;
  if (host.includes("reddit.com")) return true;
  if (host.includes("facebook.com")) return true;
  if (host.includes("t.me") || host.includes("telegram.org")) return true;
  if (host.includes("notion.site") || host.includes("notion.so")) return true;
  if (host.includes("threads.com") && !pathname.includes("/share/"))
    return true;
  if (
    host.includes("threads.net") &&
    !pathname.includes("/t/") &&
    !pathname.includes("/share/")
  ) {
    return true;
  }
  return false;
}

export function getEmbedInfo(urlStr: string): EmbedInfo | null {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.replace("www.", "").toLowerCase();

    // Notion Pages & Workspaces
    if (host.includes("notion.site") || host.includes("notion.so")) {
      return {
        type: "notion",
        embedUrl: urlStr,
        domain: host,
      };
    }

    // GitHub Repositories
    if (host.includes("github.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return {
          type: "github",
          embedUrl: urlStr,
          owner: parts[0],
          repo: parts[1],
        };
      }
      return {
        type: "card",
        embedUrl: urlStr,
        domain: "github.com",
      };
    }

    // Threads Posts & Profiles
    if (host.includes("threads.net") || host.includes("threads.com")) {
      return {
        type: "threads",
        embedUrl: urlStr,
      };
    }

    // Instagram Posts & Profiles
    if (host.includes("instagram.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if ((parts[0] === "p" || parts[0] === "reel") && parts[1]) {
        return {
          type: "instagram",
          embedUrl: `https://www.instagram.com/${parts[0]}/${parts[1]}/embed`,
        };
      }
      if (
        parts[0] &&
        !["explore", "reels", "stories", "direct"].includes(parts[0])
      ) {
        return {
          type: "instagram-profile",
          embedUrl: urlStr,
          username: parts[0],
        };
      }
    }

    // Google Docs, Sheets, Slides
    if (host.includes("docs.google.com")) {
      if (url.pathname.includes("/document/d/")) {
        const docId = url.pathname.split("/document/d/")[1]?.split("/")[0];
        if (docId) {
          return {
            embedUrl: `https://docs.google.com/document/d/${docId}/preview`,
            type: "google-docs",
          };
        }
      }
      if (url.pathname.includes("/spreadsheets/d/")) {
        const sheetId = url.pathname
          .split("/spreadsheets/d/")[1]
          ?.split("/")[0];
        if (sheetId) {
          return {
            embedUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/preview`,
            type: "google-docs",
          };
        }
      }
      if (url.pathname.includes("/presentation/d/")) {
        const slideId = url.pathname
          .split("/presentation/d/")[1]
          ?.split("/")[0];
        if (slideId) {
          return {
            embedUrl: `https://docs.google.com/presentation/d/${slideId}/embed`,
            type: "google-docs",
          };
        }
      }
    }

    // X / Twitter
    if (host.includes("twitter.com") || host.includes("x.com")) {
      return {
        embedUrl: `https://twitframe.com/show?url=${encodeURIComponent(urlStr)}`,
        type: "twitter",
      };
    }

    // YouTube
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      let videoId = "";
      if (host.includes("youtu.be")) {
        videoId = url.pathname.slice(1);
      } else if (url.pathname.includes("/embed/")) {
        videoId = url.pathname.split("/embed/")[1];
      } else if (url.pathname.includes("/shorts/")) {
        videoId = url.pathname.split("/shorts/")[1];
      } else {
        videoId = url.searchParams.get("v") || "";
      }
      if (videoId) {
        return {
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
          type: "youtube",
        };
      }
    }

    // Vimeo
    if (host.includes("vimeo.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const videoId = parts[0];
      if (videoId && /^\d+$/.test(videoId)) {
        return {
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          type: "vimeo",
        };
      }
    }

    // Spotify
    if (host.includes("spotify.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return {
          embedUrl: `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`,
          type: "spotify",
        };
      }
    }

    if (isFrameRestrictedHost(host, url.pathname)) {
      return {
        type: "card",
        embedUrl: urlStr,
        domain: host,
      };
    }

    return {
      embedUrl: urlStr,
      type: "iframe",
    };
  } catch {
    return null;
  }
}

function NotionEmbedCard({ url, domain }: { url: string; domain: string }) {
  let title = "Notion Workspace";
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    if (parts[0]) {
      title = parts[0].replace(/-/g, " ");
    }
  } catch {
    title = "Notion Page";
  }
  return (
    <div className="flex size-full flex-col justify-between bg-stone-950 p-3.5 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-white px-1.5 py-0.5 text-xs font-bold text-black">
            N
          </span>
          <span className="text-xs font-semibold tracking-wide text-stone-300">
            Notion
          </span>
        </div>
        <span className="rounded bg-stone-800 px-2 py-0.5 font-mono text-[10px] text-stone-400">
          {domain}
        </span>
      </div>
      <div className="my-1.5">
        <h4 className="line-clamp-1 text-sm font-bold capitalize text-stone-100">
          {title}
        </h4>
        <p className="line-clamp-1 text-[11px] text-stone-400">
          View page & documents on Notion
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-stone-100 px-3 py-1 text-xs font-medium text-stone-900 transition-colors hover:bg-white"
      >
        <span>Open Notion Page</span>
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

function ThreadsEmbedCard({ url }: { url: string }) {
  return (
    <div className="flex size-full flex-col justify-between bg-zinc-950 p-3.5 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-black">
            @
          </span>
          <span className="text-xs font-semibold tracking-wide text-zinc-200">
            Threads Post
          </span>
        </div>
        <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
          threads.net
        </span>
      </div>
      <div className="my-1.5">
        <p className="line-clamp-2 text-xs text-zinc-300">
          View post, images, & discussions on Threads
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1 text-xs font-medium text-black transition-colors hover:bg-zinc-200"
      >
        <span>Open Post on Threads</span>
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

function TwitterEmbedCard({ url }: { url: string }) {
  let handle = "X / Twitter";
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    if (parts[0]) {
      handle = `@${parts[0]}`;
    }
  } catch {
    handle = "X / Twitter";
  }
  return (
    <div className="flex size-full flex-col justify-between bg-black p-3.5 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-sky-400">𝕏</span>
          <span className="text-xs font-semibold tracking-wide text-slate-300">
            {handle}
          </span>
        </div>
        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
          x.com
        </span>
      </div>
      <div className="my-1.5">
        <p className="line-clamp-2 text-xs text-slate-300">
          View post & comments on X (Twitter)
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-sky-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-sky-400"
      >
        <span>Open Post on X</span>
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

function GitHubEmbedCard({
  owner,
  repo,
  url,
}: {
  owner: string;
  repo: string;
  url: string;
}) {
  return (
    <div className="flex size-full flex-col justify-between bg-slate-950 p-3.5 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Github className="size-5 text-purple-400" />
          <span className="text-xs font-semibold tracking-wide text-purple-300">
            GitHub Repository
          </span>
        </div>
        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
          github.com
        </span>
      </div>
      <div className="my-1.5">
        <h4 className="truncate text-sm font-bold text-white">
          {owner} / <span className="text-purple-400">{repo}</span>
        </h4>
        <p className="line-clamp-1 text-[11px] text-slate-400">
          View code, issues, & releases on GitHub
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-purple-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-purple-500"
      >
        <span>Open Repository</span>
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

function InstagramProfileCard({
  username,
  url,
}: {
  username: string;
  url: string;
}) {
  return (
    <div className="flex size-full flex-col justify-between bg-gradient-to-br from-purple-900 via-pink-900 to-rose-950 p-3.5 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Instagram className="size-5 text-pink-300" />
          <span className="text-xs font-semibold tracking-wide text-pink-200">
            Instagram Profile
          </span>
        </div>
        <span className="rounded bg-black/40 px-2 py-0.5 font-mono text-[10px] text-pink-200">
          instagram.com
        </span>
      </div>
      <div className="my-1.5">
        <h4 className="truncate text-sm font-bold text-white">@{username}</h4>
        <p className="line-clamp-1 text-[11px] text-pink-200/80">
          View photos & reels on Instagram
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-pink-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-pink-500"
      >
        <span>View Profile</span>
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

function WebCard({ url, domain }: { url: string; domain: string }) {
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  return (
    <div className="flex size-full flex-col justify-between bg-slate-900 p-3.5 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={faviconUrl} alt="favicon" className="size-4 rounded" />
          <span className="text-xs font-semibold tracking-wide text-slate-300">
            {domain}
          </span>
        </div>
        <Globe className="size-4 text-slate-400" />
      </div>
      <div className="my-1">
        <p className="line-clamp-2 break-all font-mono text-[11px] text-slate-300">
          {url}
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-500"
      >
        <span>Open Link</span>
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

export function UrlEmbed({
  url,
  onClose,
  className,
}: {
  url: string;
  onClose?: () => void;
  className?: string;
}) {
  const [loadError, setLoadError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const embedInfo = getEmbedInfo(url);

  useEffect(() => {
    if (embedInfo?.type === "iframe" && !iframeLoaded && !loadError) {
      const timer = setTimeout(() => {
        setIframeLoaded(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [embedInfo?.type, iframeLoaded, loadError]);

  if (!embedInfo) return null;

  let embedContent: React.ReactNode = null;

  if (loadError) {
    if (embedInfo.type === "twitter") {
      embedContent = <TwitterEmbedCard url={url} />;
    } else {
      let domain = "web";
      try {
        domain = new URL(url).hostname.replace("www.", "");
      } catch {
        domain = url;
      }
      embedContent = <WebCard url={url} domain={domain} />;
    }
  } else {
    switch (embedInfo.type) {
      case "threads":
        embedContent = <ThreadsEmbedCard url={url} />;
        break;
      case "notion":
        embedContent = <NotionEmbedCard url={url} domain={embedInfo.domain} />;
        break;
      case "github":
        embedContent = (
          <GitHubEmbedCard
            owner={embedInfo.owner}
            repo={embedInfo.repo}
            url={url}
          />
        );
        break;
      case "instagram-profile":
        embedContent = (
          <InstagramProfileCard username={embedInfo.username} url={url} />
        );
        break;
      case "card":
        embedContent = <WebCard url={url} domain={embedInfo.domain} />;
        break;
      default:
        embedContent = (
          <div className="relative size-full">
            {!iframeLoaded && (
              <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900" />
            )}
            <iframe
              src={embedInfo.embedUrl}
              className="size-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
              loading="lazy"
              onLoad={() => setIframeLoaded(true)}
              onError={() => setLoadError(true)}
            />
          </div>
        );
        break;
    }
  }

  return (
    <div
      className={cn(
        "relative flex size-full min-h-[11rem] flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
        <span className="max-w-[75%] truncate font-mono text-[11px]">
          {url}
        </span>
        <div className="flex items-center gap-1.5">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] hover:text-foreground"
            title="Open link in new tab"
          >
            <ExternalLink className="size-3" />
          </a>
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="rounded p-0.5 hover:bg-accent hover:text-foreground"
              title="Close embed"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="relative size-full min-h-0 flex-1 bg-black/90">
        {embedContent}
      </div>
    </div>
  );
}
