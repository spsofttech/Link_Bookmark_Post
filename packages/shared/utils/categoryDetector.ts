export const POST_CATEGORIES = {
  SHARE_IMAGE: "Share Image",
  VIDEO: "Video",
  CODE_TECH: "Code & Tech",
  SKILLS: "Skills",
  AGENTS: "Agents",
  COMMANDS: "Commands",
  ARTICLE_BLOG: "Article & Blog",
  SOCIAL_THREAD: "Social & Thread",
  AUDIO_PODCAST: "Audio & Podcast",
  DOCUMENT_PDF: "Document & PDF",
  PRODUCT_TOOL: "Product & Tool",
} as const;

export type PostCategory =
  (typeof POST_CATEGORIES)[keyof typeof POST_CATEGORIES];

export function detectPostCategory(item: {
  url?: string | null;
  title?: string | null;
  description?: string | null;
  content?: string | null;
  note?: string | null;
  type?: string | null;
  tags?: string[] | null;
}): PostCategory {
  const url = item.url?.toLowerCase() || "";
  const title = item.title?.toLowerCase() || "";
  const description = item.description?.toLowerCase() || "";
  const content = item.content?.toLowerCase() || "";
  const note = item.note?.toLowerCase() || "";
  const tags = (item.tags || []).map((t) => t.toLowerCase());

  const fullText = `${url} ${title} ${description} ${content} ${note} ${tags.join(" ")}`;

  // 1. Explicit AI Template / Agent taxonomy check
  if (fullText.includes("skill") || tags.some((t) => t.includes("skill"))) {
    return POST_CATEGORIES.SKILLS;
  }
  if (fullText.includes("agent") || tags.some((t) => t.includes("agent"))) {
    return POST_CATEGORIES.AGENTS;
  }
  if (fullText.includes("command") || tags.some((t) => t.includes("command"))) {
    return POST_CATEGORIES.COMMANDS;
  }

  // 2. Share Image detection
  const isImageExtension =
    /\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff|ico)(\?.*)?$/i.test(url);
  const isImageDomain =
    /(unsplash\.com|pexels\.com|pixabay\.com|imgur\.com|giphy\.com|pinterest\.com|instagram\.com\/p\/|flickr\.com|deviantart\.com|gfycat\.com)/i.test(
      url,
    );
  const isImageKeyword =
    /\b(photo|image|picture|wallpaper|infographic|drawing|illustration|banner|thumbnail|screenshot|canvas|design|figma|ui\/ux)\b/i.test(
      fullText,
    );

  if (
    isImageExtension ||
    isImageDomain ||
    (item.type === "asset" && isImageKeyword)
  ) {
    return POST_CATEGORIES.SHARE_IMAGE;
  }

  // 3. Video detection
  const isVideoExtension = /\.(mp4|webm|m3u8|avi|mov|mkv)(\?.*)?$/i.test(url);
  const isVideoDomain =
    /(youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|twitch\.tv|dailymotion\.com|loom\.com|rumble\.com)/i.test(
      url,
    );
  if (isVideoExtension || isVideoDomain) {
    return POST_CATEGORIES.VIDEO;
  }

  // 4. Code & Tech detection
  const isCodeDomain =
    /(github\.com|gist\.github\.com|gitlab\.com|bitbucket\.org|stackoverflow\.com|dev\.to|npmjs\.com|pypi\.org|codepen\.io|replit\.com|kaggle\.com|huggingface\.co|news\.ycombinator\.com)/i.test(
      url,
    );
  const isCodeKeyword =
    /\b(code|coding|github|typescript|javascript|python|react|nextjs|node|api|framework|library|backend|frontend|css|database|sql|docker)\b/i.test(
      fullText,
    );
  if (isCodeDomain || isCodeKeyword) {
    return POST_CATEGORIES.CODE_TECH;
  }

  // 5. Social & Thread detection
  const isSocialDomain =
    /(twitter\.com|x\.com|reddit\.com|linkedin\.com|threads\.net|mastodon\.social|bsky\.app)/i.test(
      url,
    );
  if (isSocialDomain) {
    return POST_CATEGORIES.SOCIAL_THREAD;
  }

  // 6. Audio & Podcast detection
  const isAudioExtension = /\.(mp3|wav|aac|flac|m4a)(\?.*)?$/i.test(url);
  const isAudioDomain =
    /(spotify\.com|soundcloud\.com|podcasts\.apple\.com|anchor\.fm|overcast\.fm)/i.test(
      url,
    );
  if (isAudioExtension || isAudioDomain) {
    return POST_CATEGORIES.AUDIO_PODCAST;
  }

  // 7. Document & PDF detection
  const isDocExtension = /\.(pdf|docx|xlsx|pptx|csv)(\?.*)?$/i.test(url);
  const isDocDomain =
    /(docs\.google\.com|slideshare\.net|arxiv\.org|scribd\.com|notion\.site)/i.test(
      url,
    );
  if (isDocExtension || isDocDomain) {
    return POST_CATEGORIES.DOCUMENT_PDF;
  }

  // 8. Article & Blog detection
  const isArticleDomain =
    /(medium\.com|substack\.com|hashnode\.dev|wikipedia\.org|nytimes\.com|bbc\.com|techcrunch\.com|wired\.com)/i.test(
      url,
    );
  if (
    isArticleDomain ||
    fullText.includes("article") ||
    fullText.includes("blog")
  ) {
    return POST_CATEGORIES.ARTICLE_BLOG;
  }

  // 9. Product & Tool detection
  const isProductDomain = /(producthunt\.com|appsumo\.com|saas|tool)/i.test(
    url,
  );
  if (isProductDomain) {
    return POST_CATEGORIES.PRODUCT_TOOL;
  }

  // Fallback default category
  if (isImageKeyword) return POST_CATEGORIES.SHARE_IMAGE;
  return POST_CATEGORIES.ARTICLE_BLOG;
}
