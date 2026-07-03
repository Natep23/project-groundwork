/* Leveled console logger; debug/info are silenced in production builds. */

type Level = "debug" | "info" | "warn" | "error";

const isProd = import.meta.env.PROD;

function log(level: Level, message: string, ...context: unknown[]) {
  if (isProd && (level === "debug" || level === "info")) return;
  // eslint-disable-next-line no-console
  console[level](`[groundwork] ${message}`, ...context);
}

export const logger = {
  debug: (message: string, ...context: unknown[]) => log("debug", message, ...context),
  info: (message: string, ...context: unknown[]) => log("info", message, ...context),
  warn: (message: string, ...context: unknown[]) => log("warn", message, ...context),
  error: (message: string, ...context: unknown[]) => log("error", message, ...context),
};
