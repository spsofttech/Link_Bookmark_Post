"use client";

import { useState } from "react";
import { ExternalLink, X } from "lucide-react";

export function getEmbedInfo(urlStr: string): {
  embedUrl: string;
  type: "youtube" | "vimeo" | "instagram" | "spotify" | "iframe";
} | null {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.replace("www.", "").toLowerCase();

    // YouTube
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      let videoId = "";
      if (host.includes("youtu.be")) {
        videoId = url.pathname.slice(1);
      } else if (url.pathname.includes("/embed/")) {
        videoId = url.pathname.split("/embed/")[1];
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

    // Instagram
    if (host.includes("instagram.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if ((parts[0] === "p" || parts[0] === "reel") && parts[1]) {
        return {
          embedUrl: `https://www.instagram.com/${parts[0]}/${parts[1]}/embed`,
          type: "instagram",
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

    // Default iframe embed for web URL
    return {
      embedUrl: urlStr,
      type: "iframe",
    };
  } catch {
    return null;
  }
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
  const embedInfo = getEmbedInfo(url);

  if (!embedInfo) return null;

  return (
    <div className={`relative w-full overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs text-muted-foreground bg-muted/40">
        <span className="truncate font-mono text-[11px] max-w-[80%]">{url}</span>
        <div className="flex items-center gap-1.5">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground text-[11px]"
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
      <div className="relative aspect-video w-full bg-black/90">
        {!loadError ? (
          <iframe
            src={embedInfo.embedUrl}
            className="size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
            loading="lazy"
            onError={() => setLoadError(true)}
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground">
            <p className="mb-2 font-medium">This site does not allow iframe embedding.</p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Open Original Page <ExternalLink className="size-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
