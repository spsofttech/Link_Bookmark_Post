-- ============================================================
-- Karakeep - Missing Tables Migration
-- Run this in Supabase SQL Editor to add all missing tables
-- ============================================================

-- ============================================================
-- CONFIG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "config" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "value" TEXT NOT NULL
);

-- ============================================================
-- CUSTOM PROMPTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "customPrompts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "text" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "appliesTo" TEXT NOT NULL CHECK ("appliesTo" IN ('all_tagging', 'text', 'images', 'summary')),
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "customPrompts_userId_idx" ON "customPrompts"("userId");

-- ============================================================
-- CHAT SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "chatSessions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "modifiedAt" BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);
CREATE INDEX IF NOT EXISTS "chatSessions_userId_idx" ON "chatSessions"("userId");
CREATE INDEX IF NOT EXISTS "chatSessions_userId_modifiedAt_idx" ON "chatSessions"("userId", "modifiedAt");

-- ============================================================
-- CHAT MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "chatMessages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "chatId" TEXT NOT NULL REFERENCES "chatSessions"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL CHECK ("role" IN ('user', 'assistant', 'toolResult')),
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);
CREATE INDEX IF NOT EXISTS "chatMessages_chatId_idx" ON "chatMessages"("chatId");
CREATE INDEX IF NOT EXISTS "chatMessages_chatId_createdAt_idx" ON "chatMessages"("chatId", "createdAt");

-- ============================================================
-- RSS FEEDS TABLE (correct name: rssFeeds)
-- ============================================================
CREATE TABLE IF NOT EXISTS "rssFeeds" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "importTags" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "lastFetchedAt" BIGINT,
  "lastSuccessfulFetchAt" BIGINT,
  "lastFetchedStatus" TEXT DEFAULT 'pending' CHECK ("lastFetchedStatus" IN ('pending', 'failure', 'success')),
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "rssFeeds_userId_idx" ON "rssFeeds"("userId");

-- ============================================================
-- RSS FEED IMPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "rssFeedImports" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "entryId" TEXT NOT NULL,
  "rssFeedId" TEXT NOT NULL REFERENCES "rssFeeds"("id") ON DELETE CASCADE,
  "bookmarkId" TEXT REFERENCES "bookmarks"("id") ON DELETE SET NULL,
  UNIQUE("rssFeedId", "entryId")
);
CREATE INDEX IF NOT EXISTS "rssFeedImports_feedIdIdx_idx" ON "rssFeedImports"("rssFeedId");
CREATE INDEX IF NOT EXISTS "rssFeedImports_entryIdIdx_idx" ON "rssFeedImports"("entryId");
CREATE INDEX IF NOT EXISTS "rssFeedImports_bookmarkId_idx" ON "rssFeedImports"("bookmarkId");
CREATE INDEX IF NOT EXISTS "rssFeedImports_rssFeedId_bookmarkId_idx" ON "rssFeedImports"("rssFeedId", "bookmarkId");

-- ============================================================
-- WEBHOOKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "webhooks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "url" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "events" JSONB NOT NULL,
  "token" TEXT
);
CREATE INDEX IF NOT EXISTS "webhooks_userId_idx" ON "webhooks"("userId");

-- ============================================================
-- LIST INVITATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "listInvitations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "listId" TEXT NOT NULL REFERENCES "bookmarkLists"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL CHECK ("role" IN ('viewer', 'editor')),
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'declined')),
  "invitedAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "invitedEmail" TEXT,
  "invitedBy" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  UNIQUE("listId", "userId")
);
CREATE INDEX IF NOT EXISTS "listInvitations_listId_idx" ON "listInvitations"("listId");
CREATE INDEX IF NOT EXISTS "listInvitations_userId_idx" ON "listInvitations"("userId");
CREATE INDEX IF NOT EXISTS "listInvitations_status_idx" ON "listInvitations"("status");

-- ============================================================
-- RULE ENGINE RULES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "ruleEngineRules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "event" TEXT NOT NULL,
  "condition" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "tagId" TEXT
);
CREATE INDEX IF NOT EXISTS "ruleEngine_userId_idx" ON "ruleEngineRules"("userId");

-- ============================================================
-- RULE ENGINE ACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "ruleEngineActions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "ruleId" TEXT NOT NULL REFERENCES "ruleEngineRules"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL,
  "listId" TEXT,
  "tagId" TEXT
);
CREATE INDEX IF NOT EXISTS "ruleEngineActions_userId_idx" ON "ruleEngineActions"("userId");
CREATE INDEX IF NOT EXISTS "ruleEngineActions_ruleId_idx" ON "ruleEngineActions"("ruleId");

-- ============================================================
-- INVITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "invites" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "usedAt" BIGINT,
  "invitedBy" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

-- ============================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "stripeCustomerId" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT,
  "status" TEXT NOT NULL CHECK ("status" IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'trialing', 'incomplete_expired', 'paused')),
  "tier" TEXT NOT NULL DEFAULT 'free' CHECK ("tier" IN ('free', 'paid')),
  "priceId" TEXT,
  "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
  "startDate" BIGINT,
  "endDate" BIGINT,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "modifiedAt" BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);
CREATE INDEX IF NOT EXISTS "subscriptions_userId_idx" ON "subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "subscriptions_stripeCustomerId_idx" ON "subscriptions"("stripeCustomerId");

-- ============================================================
-- IMPORT SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "importSessions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "message" TEXT,
  "rootListId" TEXT REFERENCES "bookmarkLists"("id") ON DELETE SET NULL,
  "status" TEXT NOT NULL DEFAULT 'staging' CHECK ("status" IN ('staging', 'pending', 'running', 'paused', 'completed', 'failed', 'archived')),
  "lastProcessedAt" BIGINT,
  "completedAt" BIGINT,
  "totalBookmarks" INTEGER NOT NULL DEFAULT 0,
  "completedBookmarks" INTEGER NOT NULL DEFAULT 0,
  "failedBookmarks" INTEGER NOT NULL DEFAULT 0,
  "pendingBookmarks" INTEGER NOT NULL DEFAULT 0,
  "processingBookmarks" INTEGER NOT NULL DEFAULT 0,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "modifiedAt" BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);
CREATE INDEX IF NOT EXISTS "importSessions_userId_idx" ON "importSessions"("userId");
CREATE INDEX IF NOT EXISTS "importSessions_status_idx" ON "importSessions"("status");
CREATE INDEX IF NOT EXISTS "importSessions_status_completedAt_idx" ON "importSessions"("status", "completedAt");

-- ============================================================
-- IMPORT SESSION BOOKMARKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "importSessionBookmarks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "importSessionId" TEXT NOT NULL REFERENCES "importSessions"("id") ON DELETE CASCADE,
  "bookmarkId" TEXT NOT NULL REFERENCES "bookmarks"("id") ON DELETE CASCADE,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  UNIQUE("importSessionId", "bookmarkId")
);
CREATE INDEX IF NOT EXISTS "importSessionBookmarks_bookmarkId_idx" ON "importSessionBookmarks"("bookmarkId");

-- ============================================================
-- IMPORT STAGING BOOKMARKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "importStagingBookmarks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "importSessionId" TEXT NOT NULL REFERENCES "importSessions"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL CHECK ("type" IN ('link', 'text', 'asset')),
  "url" TEXT,
  "title" TEXT,
  "content" TEXT,
  "note" TEXT,
  "tags" JSONB,
  "listIds" JSONB,
  "sourceAddedAt" BIGINT,
  "archived" BOOLEAN,
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'processing', 'completed', 'failed')),
  "processingStartedAt" BIGINT,
  "result" TEXT CHECK ("result" IN ('accepted', 'rejected', 'skipped_duplicate')),
  "resultReason" TEXT,
  "resultBookmarkId" TEXT REFERENCES "bookmarks"("id") ON DELETE SET NULL,
  "createdAt" BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "completedAt" BIGINT
);
CREATE INDEX IF NOT EXISTS "importStaging_session_status_idx" ON "importStagingBookmarks"("importSessionId", "status");
CREATE INDEX IF NOT EXISTS "importStaging_completedAt_idx" ON "importStagingBookmarks"("completedAt");
CREATE INDEX IF NOT EXISTS "importStaging_resultBookmarkId_idx" ON "importStagingBookmarks"("resultBookmarkId");
CREATE INDEX IF NOT EXISTS "importStaging_status_idx" ON "importStagingBookmarks"("status");
CREATE INDEX IF NOT EXISTS "importStaging_status_processingStartedAt_idx" ON "importStagingBookmarks"("status", "processingStartedAt");

-- ============================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

-- bookmarkTags: add normalizedName column if missing
ALTER TABLE "bookmarkTags" ADD COLUMN IF NOT EXISTS "normalizedName" TEXT;
CREATE INDEX IF NOT EXISTS "bookmarkTags_normalizedName_idx" ON "bookmarkTags"("normalizedName");

-- backups: add missing columns
ALTER TABLE "backups" ADD COLUMN IF NOT EXISTS "bookmarkCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "backups" ADD COLUMN IF NOT EXISTS "storageProvider" TEXT DEFAULT 'local';
ALTER TABLE "backups" ADD COLUMN IF NOT EXISTS "storageObjectPath" TEXT;

-- ============================================================
-- DISABLE ROW LEVEL SECURITY ON NEW TABLES
-- ============================================================
ALTER TABLE "config" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "customPrompts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "chatSessions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "chatMessages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "rssFeeds" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "rssFeedImports" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "webhooks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "listInvitations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ruleEngineRules" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ruleEngineActions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "invites" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "importSessions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "importSessionBookmarks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "importStagingBookmarks" DISABLE ROW LEVEL SECURITY;
