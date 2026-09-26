import "dotenv/config";

import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Config } from "drizzle-kit";

import serverConfig from "@karakeep/shared/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");

const databaseURL = serverConfig.dataDir
  ? path.isAbsolute(serverConfig.dataDir)
    ? path.join(serverConfig.dataDir, "db.db")
    : path.resolve(workspaceRoot, serverConfig.dataDir, "db.db")
  : path.resolve(workspaceRoot, "data", "db.db");

export default {
  dialect: "sqlite",
  schema: "./schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseURL,
  },
} satisfies Config;

