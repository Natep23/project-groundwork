import React from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { localDayKey } from "./dayKey";
import { logger } from "./logger";

/**
 * Fires `recordDailyVisit` with the client's local dayKey on mount, and
 * again whenever the local day rolls over while the tab stays open (checked
 * on `visibilitychange`/`focus` — a tab left open past midnight should still
 * advance the streak next time it's looked at).
 *
 * The server call is idempotent per dayKey (see `Profile.recordDailyVisit`),
 * so this is the real guard against double-counting; the `lastSentDayKey`
 * ref is purely cosmetic — it avoids firing the mutation twice in a row for
 * the same day (e.g. React StrictMode's dev double-invoke of effects).
 */
export function useDailyVisit(): void {
  const recordDailyVisit = useMutation(api.Profile.recordDailyVisit);
  const lastSentDayKey = React.useRef<string | null>(null);

  const fireIfNewDay = React.useCallback(() => {
    const today = localDayKey();
    if (lastSentDayKey.current === today) return;
    lastSentDayKey.current = today;
    recordDailyVisit({ dayKey: today }).catch((err) => {
      logger.error("recordDailyVisit failed", err);
      // Allow a retry on the next visibility/focus tick.
      if (lastSentDayKey.current === today) lastSentDayKey.current = null;
    });
  }, [recordDailyVisit]);

  React.useEffect(() => {
    fireIfNewDay();
    const onVisible = () => {
      if (document.visibilityState === "visible") fireIfNewDay();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", fireIfNewDay);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", fireIfNewDay);
    };
  }, [fireIfNewDay]);
}
