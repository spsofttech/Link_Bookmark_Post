import { detectPostCategory } from "./categoryDetector";

function cleanUrlSlug(rawUrl: string): string | null {
  try {
    const urlObj = new URL(rawUrl);
    const pathname = urlObj.pathname;
    const parts = pathname
      .split("/")
      .filter((p) => p.length > 0 && !p.includes("."));

    if (parts.length === 0) {
      return urlObj.hostname.replace(/^www\./, "");
    }

    // Take the last meaningful path segment
    const lastSegment = parts[parts.length - 1];
    const cleaned = lastSegment
      .replace(/[-_]/g, " ")
      .replace(/\.[^/.]+$/, "")
      .trim();

    if (cleaned.length > 2) {
      // Capitalize words
      return cleaned
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function extractTitleAndDescription(item: {
  url?: string | null;
  title?: string | null;
  description?: string | null;
  content?: string | null;
  note?: string | null;
}): { title: string; description: string; category: string } {
  let finalTitle = (item.title || "").trim();
  let finalDescription = (item.description || "").trim();
  const url = (item.url || "").trim();
  const content = (item.content || item.note || "").trim();

  const category = detectPostCategory(item);

  // 1. Title Extraction Logic
  const isTitleMissingOrGeneric =
    !finalTitle ||
    finalTitle.toLowerCase() === "untitled" ||
    finalTitle.toLowerCase() === "link" ||
    finalTitle.startsWith("http://") ||
    finalTitle.startsWith("https://");

  if (isTitleMissingOrGeneric) {
    if (url) {
      const slugTitle = cleanUrlSlug(url);
      if (slugTitle) {
        finalTitle = slugTitle;
      } else {
        finalTitle = url;
      }
    } else if (content) {
      // Extract first line or sentence from content
      const firstLine = content
        .split("\n")[0]
        .replace(/[#*`_]/g, "")
        .trim();
      finalTitle =
        firstLine.length > 80
          ? firstLine.slice(0, 77) + "..."
          : firstLine || "Untitled Post";
    } else {
      finalTitle = `${category} Post`;
    }
  }

  // 2. Description Extraction Logic
  if (!finalDescription) {
    if (content) {
      // Strip markdown/html tags for clean preview description
      const cleanContent = content
        .replace(/<[^>]*>/g, "")
        .replace(/[#*`_~[\]()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (cleanContent.length > 0) {
        finalDescription =
          cleanContent.length > 240
            ? cleanContent.slice(0, 237) + "..."
            : cleanContent;
      }
    }

    if (!finalDescription && url) {
      try {
        const domain = new URL(url).hostname.replace(/^www\./, "");
        finalDescription = `Curated ${category.toLowerCase()} content saved from ${domain}. Includes component documentation, guidelines, and reference metadata.`;
      } catch {
        finalDescription = `Curated ${category.toLowerCase()} post with detailed references and metadata.`;
      }
    } else if (!finalDescription) {
      finalDescription = `Pre-built template and configuration categorized under ${category}.`;
    }
  }

  return {
    title: finalTitle,
    description: finalDescription,
    category,
  };
}
