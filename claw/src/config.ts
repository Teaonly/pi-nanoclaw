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

// Container configure
export const CONTAINER_IMAGE = process.env.CONTAINER_IMAGE || "pi-agent:latest";
export const CONTAINER_NAME_PREFIX = "vt-claw";
export const MAX_CONCURRENT_CONTAINERS = 2;
export const CONTAINER_TIMEOUT = parseInt(
  process.env.CONTAINER_TIMEOUT || "1800000",
  10,
);
export const CONTAINER_MAX_OUTPUT_SIZE = parseInt(
  process.env.CONTAINER_MAX_OUTPUT_SIZE || "10485760",
  10,
); // 10MB default

// Timing and container setup
export const IPC_POLL_INTERVAL = 1000;
export const MESSAGE_POLL_INTERVAL = 2000;
export const SCHEDULER_POLL_INTERVAL = 60000;
export const IDLE_TIMEOUT = parseInt(process.env.IDLE_TIMEOUT || "1800000", 10); // 30min default — how long to keep container alive after last result

// Timezone for scheduled tasks (cron expressions, etc.)
// Uses system timezone by default
export const TIMEZONE =
  process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;

// These marker string must same with container
export const OUTPUT_START_MARKER = "---VT-CLAW_OUTPUT_START---";
export const OUTPUT_END_MARKER = "---VT-CLAW_OUTPUT_END---";
