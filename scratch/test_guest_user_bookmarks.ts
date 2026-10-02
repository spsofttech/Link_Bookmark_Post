import { db } from "@karakeep/db";

async function test() {
  try {
    let defaultUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "gajerasiddharth10@gmail.com"),
    });
    if (!defaultUser) {
      defaultUser = await db.query.users.findFirst();
    }
    console.log("DEFAULT GUEST USER FOUND:", defaultUser?.id, defaultUser?.email);
    
    // Check bookmark count for this user
    const bmCount = await db.query.bookmarks.findMany({
      where: (bookmarks, { eq }) => eq(bookmarks.userId, defaultUser!.id),
      limit: 5,
    });
    console.log("BOOKMARKS FOR GUEST USER:", bmCount.length);
  } catch (err) {
    console.error("ERROR:", err);
  }
  process.exit(0);
}

test();
