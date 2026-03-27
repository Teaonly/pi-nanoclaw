import os from "os";
import path from "path";

const PROJECT_ROOT = process.cwd();
export const STORE_DIR = path.resolve(PROJECT_ROOT, "..", "home", "store");
export const DATA_DIR = path.resolve(PROJECT_ROOT, "..", "home", "data");
export const GROUPS_DIR = path.resolve(
  PROJECT_ROOT,
  "..",
  "home",
  "data",
  "groups",
);
export const PI_DIR = path.resolve(PROJECT_ROOT, "..", "home", "pi");

// Timing and container setup
export const POLL_INTERVAL = 2000;
export const MAX_CONCURRENT_CONTAINERS = 2;
export const IDLE_TIMEOUT = parseInt(process.env.IDLE_TIMEOUT || "1800000", 10); // 30min default — how long to keep container alive after last result

// Timezone for scheduled tasks (cron expressions, etc.)
// Uses system timezone by default
export const TIMEZONE =
  process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
