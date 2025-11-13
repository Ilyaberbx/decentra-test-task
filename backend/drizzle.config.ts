import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./src/configs/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.MYSQL_CONNECTION_URL!,
  },
} satisfies Config;
