import "./loadEnv";
import { spawnSync } from "node:child_process";
import { requireEnv } from "./loadEnv";

requireEnv("DATABASE_URL");

const result = spawnSync("npx", ["prisma", "migrate", "dev", "--name", "init"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env
});

process.exit(result.status ?? 1);
