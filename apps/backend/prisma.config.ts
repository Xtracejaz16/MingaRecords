import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "prisma/config";

dotenv.config({ path: path.resolve(__dirname, "src/.env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Usa process.env directamente
    url: process.env.DATABASE_URL,
  },
});