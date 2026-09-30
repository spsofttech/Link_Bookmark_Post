-- ============================================================
-- Karakeep - Complete Supabase/PostgreSQL Schema
-- Run this in your Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- Enable UUID extension (already enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BIGINT,
  "image" TEXT,
  "password" TEXT,
  "salt" TEXT NOT NULL DEFAULT '',
  "role" TEXT DEFAULT 'user' CHECK ("role" IN ('admin', 'user')),
  "bookmarkQuota" INTEGER,
  "storageQuota" INTEGER,
  "browserCrawlingEnabled" BOOLEAN,
  "manualTierName" TEXT,
  "bookmarkClickAction" TEXT NOT NULL DEFAULT 'open_original_link' CHECK ("bookmarkClickAction" IN ('open_original_link', 'expand_bookmark_preview')),
  "archiveDisplayBehaviour" TEXT NOT NULL DEFAULT 'show' CHECK ("archiveDisplayBehaviour" IN ('show', 'hide')),
  "timezone" TEXT DEFAULT 'UTC',
  "backupsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "backupsFrequency" TEXT NOT NULL DEFAULT 'weekly' CHECK ("backupsFrequency" IN ('daily', 'weekly')),
  "backupsRetentionDays" INTEGER NOT NULL DEFAULT 30,
  "readerFontSize" INTEGER,
  "readerLineHeight" REAL,
  "readerFontFamily" TEXT CHECK ("readerFontFamily" IN ('serif', 'sans', 'mono')),
  "autoTaggingEnabled" BOOLEAN,
  "autoSummarizationEnabled" BOOLEAN,
  "tagStyle" TEXT DEFAULT 'titlecase-spaces' CHECK ("tagStyle" IN ('lowercase-hyphens','lowercase-spaces','lowercase-underscores','titlecase-spaces','titlecase-hyphens','camelCase','as-generated')),
  "curatedTagIds" JSONB,
  "inferredTagLang" TEXT
);

-- ============================================================
-- ACCOUNT TABLE (OAuth)
-- ============================================================
CREATE TABLE IF NOT EXISTS "account" (
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  PRIMARY KEY ("provider", "providerAccountId")
);

-- ============================================================
-- SESSION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "session" (
  "sessionToken" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "expires" BIGINT NOT NULL
);

-- ============================================================
-- VERIFICATION TOKEN TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "verificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" BIGINT NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

-- ============================================================
-- PASSWORD RESET TOKEN TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "passwordResetToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "token" TEXT NOT NULL UNIQUE,
  "expires" BIGINT NOT NULL,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);
CREATE INDEX IF NOT EXISTS "passwordResetTokens_userId_idx" ON "passwordResetToken"("userId");

-- ============================================================
-- API KEYS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "apiKey" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "lastUsedAt" BIGINT,
  "keyId" TEXT NOT NULL UNIQUE,
  "keyHash" TEXT NOT NULL,
  "scopes" JSONB NOT NULL DEFAULT '["*"]',
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  UNIQUE("name", "userId")
);

-- ============================================================
-- BOOKMARKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "bookmarks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "lastSavedAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "modifiedAt" BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "title" TEXT,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "favourited" BOOLEAN NOT NULL DEFAULT false,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "taggingStatus" TEXT DEFAULT 'pending' CHECK ("taggingStatus" IN ('pending', 'failure', 'success')),
  "summarizationStatus" TEXT DEFAULT 'pending' CHECK ("summarizationStatus" IN ('pending', 'failure', 'success')),
  "embeddingStatus" TEXT DEFAULT 'pending' CHECK ("embeddingStatus" IN ('pending', 'failure', 'success')),
  "summary" TEXT,
  "note" TEXT,
  "type" TEXT NOT NULL CHECK ("type" IN ('link', 'text', 'asset')),
  "source" TEXT CHECK ("source" IN ('api','web','extension','cli','mobile','singlefile','rss','import'))
);

CREATE INDEX IF NOT EXISTS "bookmarks_lastSavedAt_idx" ON "bookmarks"("lastSavedAt");
CREATE INDEX IF NOT EXISTS "bookmarks_userId_lastSavedAt_id_idx" ON "bookmarks"("userId", "lastSavedAt", "id");
CREATE INDEX IF NOT EXISTS "bookmarks_userId_archived_lastSavedAt_id_idx" ON "bookmarks"("userId", "archived", "lastSavedAt", "id");
CREATE INDEX IF NOT EXISTS "bookmarks_userId_favourited_lastSavedAt_id_idx" ON "bookmarks"("userId", "favourited", "lastSavedAt", "id");

-- ============================================================
-- BOOKMARK LINKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "bookmarkLinks" (
  "id" TEXT NOT NULL PRIMARY KEY REFERENCES "bookmarks"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "author" TEXT,
  "publisher" TEXT,
  "datePublished" BIGINT,
  "dateModified" BIGINT,
  "imageUrl" TEXT,
  "favicon" TEXT,
  "htmlContent" TEXT,
  "contentAssetId" TEXT,
  "readerViewStatus" TEXT CHECK ("readerViewStatus" IN ('readable', 'not_readable', 'uncertain', 'unavailable')),
  "readerViewScore" INTEGER,
  "readerViewReasons" JSONB,
  "readerViewClassifierVersion" INTEGER,
  "crawledAt" BIGINT,
  "crawlStatus" TEXT DEFAULT 'pending' CHECK ("crawlStatus" IN ('pending', 'failure', 'success')),
  "crawlStatusCode" INTEGER DEFAULT 200,
  "probeMetadataAt" BIGINT
);

CREATE INDEX IF NOT EXISTS "bookmarkLinks_url_idx" ON "bookmarkLinks"("url");

-- ============================================================
-- ASSETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "assets" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "assetType" TEXT NOT NULL CHECK ("assetType" IN ('linkBannerImage','linkScreenshot','linkPdf','assetScreenshot','linkFullPageArchive','linkPrecrawledArchive','linkVideo','linkHtmlContent','bookmarkAsset','userUploaded','avatar','backup','unknown')),
  "size" INTEGER NOT NULL DEFAULT 0,
  "contentType" TEXT,
  "fileName" TEXT,
  "bookmarkId" TEXT REFERENCES "bookmarks"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "assets_bookmarkId_idx" ON "assets"("bookmarkId");
CREATE INDEX IF NOT EXISTS "assets_assetType_idx" ON "assets"("assetType");
CREATE INDEX IF NOT EXISTS "assets_userId_idx" ON "assets"("userId");

-- ============================================================
-- HIGHLIGHTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "highlights" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "bookmarkId" TEXT NOT NULL REFERENCES "bookmarks"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "startOffset" INTEGER NOT NULL,
  "endOffset" INTEGER NOT NULL,
  "color" TEXT NOT NULL DEFAULT 'yellow' CHECK ("color" IN ('red', 'green', 'blue', 'yellow')),
  "text" TEXT,
  "note" TEXT,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

CREATE INDEX IF NOT EXISTS "highlights_bookmarkId_idx" ON "highlights"("bookmarkId");
CREATE INDEX IF NOT EXISTS "highlights_userId_idx" ON "highlights"("userId");

-- ============================================================
-- USER READING PROGRESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "userReadingProgress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "bookmarkId" TEXT NOT NULL REFERENCES "bookmarks"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "readingProgressOffset" INTEGER NOT NULL,
  "readingProgressAnchor" TEXT,
  "readingProgressPercent" INTEGER,
  "modifiedAt" BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  UNIQUE("bookmarkId", "userId")
);

CREATE INDEX IF NOT EXISTS "userReadingProgress_bookmarkId_idx" ON "userReadingProgress"("bookmarkId");
CREATE INDEX IF NOT EXISTS "userReadingProgress_userId_idx" ON "userReadingProgress"("userId");

-- ============================================================
-- BOOKMARK TEXTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "bookmarkTexts" (
  "id" TEXT NOT NULL PRIMARY KEY REFERENCES "bookmarks"("id") ON DELETE CASCADE,
  "text" TEXT,
  "sourceUrl" TEXT
);

-- ============================================================
-- BOOKMARK ASSETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "bookmarkAssets" (
  "id" TEXT NOT NULL PRIMARY KEY REFERENCES "bookmarks"("id") ON DELETE CASCADE,
  "assetType" TEXT NOT NULL CHECK ("assetType" IN ('image', 'pdf')),
  "assetId" TEXT NOT NULL,
  "content" TEXT,
  "metadata" TEXT,
  "fileName" TEXT,
  "sourceUrl" TEXT
);

-- ============================================================
-- BOOKMARK TAGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "bookmarkTags" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  UNIQUE("userId", "name"),
  UNIQUE("userId", "id")
);

CREATE INDEX IF NOT EXISTS "bookmarkTags_name_idx" ON "bookmarkTags"("name");
CREATE INDEX IF NOT EXISTS "bookmarkTags_normalizedName_idx" ON "bookmarkTags"(lower(replace(replace(replace("name", ' ', ''), '-', ''), '_', '')));

-- ============================================================
-- TAGS ON BOOKMARKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "tagsOnBookmarks" (
  "bookmarkId" TEXT NOT NULL REFERENCES "bookmarks"("id") ON DELETE CASCADE,
  "tagId" TEXT NOT NULL REFERENCES "bookmarkTags"("id") ON DELETE CASCADE,
  "attachedAt" BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "attachedBy" TEXT NOT NULL CHECK ("attachedBy" IN ('ai', 'human')),
  PRIMARY KEY ("bookmarkId", "tagId")
);

CREATE INDEX IF NOT EXISTS "tagsOnBookmarks_tagId_bookmarkId_idx" ON "tagsOnBookmarks"("tagId", "bookmarkId");

-- ============================================================
-- BOOKMARK LISTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "bookmarkLists" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL CHECK ("type" IN ('manual', 'smart')),
  "query" TEXT,
  "parentId" TEXT REFERENCES "bookmarkLists"("id") ON DELETE SET NULL,
  "rssToken" TEXT,
  "public" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS "bookmarkLists_userId_idx" ON "bookmarkLists"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "bookmarkLists_userId_id_idx" ON "bookmarkLists"("userId", "id");

-- ============================================================
-- LIST COLLABORATORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "listCollaborators" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "listId" TEXT NOT NULL REFERENCES "bookmarkLists"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL CHECK ("role" IN ('viewer', 'editor')),
  "addedAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "addedBy" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  UNIQUE("listId", "userId")
);

CREATE INDEX IF NOT EXISTS "listCollaborators_listId_idx" ON "listCollaborators"("listId");
CREATE INDEX IF NOT EXISTS "listCollaborators_userId_idx" ON "listCollaborators"("userId");

-- ============================================================
-- BOOKMARKS IN LISTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "bookmarksInLists" (
  "bookmarkId" TEXT NOT NULL REFERENCES "bookmarks"("id") ON DELETE CASCADE,
  "listId" TEXT NOT NULL REFERENCES "bookmarkLists"("id") ON DELETE CASCADE,
  "addedAt" BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "listMembershipId" TEXT REFERENCES "listCollaborators"("id") ON DELETE CASCADE,
  PRIMARY KEY ("bookmarkId", "listId")
);

CREATE INDEX IF NOT EXISTS "bookmarksInLists_listId_bookmarkId_idx" ON "bookmarksInLists"("listId", "bookmarkId");

-- ============================================================
-- BACKUPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "backups" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "size" INTEGER NOT NULL DEFAULT 0,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "errorMessage" TEXT,
  "storageProvider" TEXT DEFAULT 'local',
  "storageObjectPath" TEXT
);

CREATE INDEX IF NOT EXISTS "backups_userId_idx" ON "backups"("userId");

-- ============================================================
-- RSS FEEDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "rssFeed" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- ============================================================
-- SEED PRIMARY USER
-- ============================================================
INSERT INTO "user" ("id", "name", "email", "role", "password", "salt")
VALUES (
  'cxzee7jvwun32h9bsndixm59',
  'Siddharth Gajera',
  'gajerasiddharth10@gmail.com',
  'admin',
  '$2a$10$HjmtTc9SlLdgrjm3.FGnIuEChS/5wKBJLLSgEJqbYlLvkJeEk3t82',
  '9073499823fe323cfae06ba2cf1ed0c20d3ff8c3d932d6e423fe815b4d8b803f'
)
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- DISABLE ROW LEVEL SECURITY (for server-side access)
-- ============================================================
ALTER TABLE "user" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "account" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "session" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "bookmarks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "bookmarkLinks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "bookmarkTexts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "bookmarkAssets" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "bookmarkTags" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "tagsOnBookmarks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "bookmarkLists" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "bookmarksInLists" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "listCollaborators" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "assets" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "highlights" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "apiKey" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "backups" DISABLE ROW LEVEL SECURITY;
