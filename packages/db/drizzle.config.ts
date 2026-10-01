import "dotenv/config";

import type { Config } from "drizzle-kit";

const databaseURL =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  "postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres";

export default {
  dialect: "postgresql",
  schema: "./schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseURL,
  },
} satisfies Config;
