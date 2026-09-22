import { Pool } from "pg";

export const pool = new Pool({
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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
