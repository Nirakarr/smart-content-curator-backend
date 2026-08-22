// prisma.config.ts
import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  // This tells 'npx prisma migrate' where your database is
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
