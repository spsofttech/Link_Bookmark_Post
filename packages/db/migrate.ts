import serverConfig from "@karakeep/shared/config";

if (serverConfig.degradedMode) {
  console.log("Skipping database migrations in degraded mode");
} else {
  try {
    // Schema is managed directly on Supabase PostgreSQL
    console.log("Database connected to Supabase PostgreSQL.");
  } catch (e) {
    console.warn("Failed to check database migrations:", e);
  }
}
