import { db } from "@karakeep/db";
import { appRouter } from "@karakeep/trpc/routers/_app";
import { createCallerFactory, Context } from "@karakeep/trpc";

async function test() {
  try {
    let defaultUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "gajerasiddharth10@gmail.com"),
    });
    if (!defaultUser) {
      const firstBookmark = await db.query.bookmarks.findFirst();
      if (firstBookmark?.userId) {
        defaultUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, firstBookmark.userId),
        });
      }
    }
    if (!defaultUser) {
      defaultUser = await db.query.users.findFirst();
    }

    const guestCtx: Context = {
      user: defaultUser
        ? {
            id: defaultUser.id,
            email: defaultUser.email,
            name: defaultUser.name,
            role: (defaultUser.role as "user" | "admin" | null) ?? "user",
          }
        : null,
      auth: defaultUser ? { type: "session" as const } : null,
      db,
      req: { ip: null },
    };

    const createCaller = createCallerFactory(appRouter);
    const caller = createCaller(guestCtx);
    const res = await caller.bookmarks.getBookmarks({});
    console.log("SUCCESS GUEST BOOKMARKS COUNT:", res.bookmarks.length);
    console.log("FIRST 3 BOOKMARKS:", res.bookmarks.slice(0, 3).map((b) => b.title));
  } catch (err) {
    console.error("ERROR GUEST CALLER:", err);
  }
  process.exit(0);
}

test();
