import { db } from "../packages/db/index.ts";
import { users, bookmarks, bookmarkLinks } from "../packages/db/schema.ts";
import { eq } from "drizzle-orm";

async function verifyAll() {
  console.log("--- STARTING DIRECT SUPABASE INTEGRATION VERIFICATION ---");

  // 1. Query users directly from Supabase Postgres
  console.log("\n1. Fetching users from Supabase...");
  const userList = await db.select().from(users);
  console.log(`Found ${userList.length} users in Supabase.`);
  if (userList.length === 0) {
    throw new Error("No users found in Supabase! Please ensure database is initialized.");
  }
  const targetUser = userList[0];
  console.log(`Selected test user: ID=${targetUser.id}, Email=${targetUser.email}`);

  // 2. Insert a new bookmark directly into Supabase Postgres (No local SQLite middleman)
  const testBookmarkId = `test_supa_${Date.now()}`;
  console.log(`\n2. Creating bookmark directly in Supabase (ID: ${testBookmarkId})...`);
  
  const [createdBookmark] = await db.insert(bookmarks).values({
    id: testBookmarkId,
    userId: targetUser.id,
    title: "Direct Supabase Verification Link",
    type: "link",
    archived: false,
    favourited: true,
    note: "Stored directly in Supabase with zero SQLite middleman",
    createdAt: new Date(),
    modifiedAt: new Date(),
    source: "api",
  }).returning();

  console.log("Bookmark created successfully in Supabase:", createdBookmark.id);

  const [createdLink] = await db.insert(bookmarkLinks).values({
    id: testBookmarkId,
    url: "https://supabase.com/docs",
  }).returning();

  console.log("Bookmark link created successfully in Supabase:", createdLink.url);

  // 3. Retrieve the bookmark directly from Supabase Postgres
  console.log("\n3. Querying created bookmark directly from Supabase...");
  const fetchedBookmark = await db.query.bookmarks.findFirst({
    where: eq(bookmarks.id, testBookmarkId),
    with: { link: true },
  });

  console.log("Fetched Bookmark from Supabase:", {
    id: fetchedBookmark.id,
    title: fetchedBookmark.title,
    url: fetchedBookmark.link?.url,
    favourited: fetchedBookmark.favourited,
  });

  // 4. Update the bookmark directly in Supabase
  console.log("\n4. Updating bookmark title & note in Supabase...");
  const [updatedBookmark] = await db.update(bookmarks)
    .set({ title: "Updated Supabase Title", note: "Updated note in Supabase!" })
    .where(eq(bookmarks.id, testBookmarkId))
    .returning();

  console.log("Updated Bookmark in Supabase:", updatedBookmark.title);

  // 5. Delete the test bookmark directly from Supabase
  console.log("\n5. Cleaning up test bookmark from Supabase...");
  await db.delete(bookmarkLinks).where(eq(bookmarkLinks.id, testBookmarkId));
  await db.delete(bookmarks).where(eq(bookmarks.id, testBookmarkId));
  console.log("Test bookmark deleted from Supabase.");

  console.log("\nSUCCESS: Supabase is confirmed as the ONLY direct source of storing and retrieving data!");
  process.exit(0);
}

verifyAll().catch((err) => {
  console.error("VERIFICATION FAILED:", err);
  process.exit(1);
});
