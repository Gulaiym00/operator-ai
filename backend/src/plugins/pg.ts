import { Pool } from "pg";

// managed Postgres providers (Supabase, Neon, ...) require SSL and use
// certs not in Node's default trust store — DB_SSL=true opts in without
// touching local dev, which talks to a plain local Postgres
const ssl = process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined;

// DATABASE_URL (the single connection string most managed providers hand
// out, e.g. Supabase's "Connect" dialog) takes priority over the individual
// DB_* fields when set, so either style of config works
export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl })
  : new Pool({
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl,
    });

pool
  .connect()
  .then((client) => {
    console.log("DB connected");
    client.release();
  })
  .catch((error) => {
    console.error("DB connection failed:", error.message);
  });
