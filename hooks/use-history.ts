"use client";

import { useCallback, useEffect, useState } from "react";
import { getHistory, clearHistory as clearStoredHistory } from "@/lib/storage";
import type { HistoryEntry } from "@/lib/types";

/** Client hook for the localStorage-backed analysis history. */
export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setLoaded(true);
  }, []);

  const refresh = useCallback(() => setHistory(getHistory()), []);

  const clear = useCallback(() => {
    clearStoredHistory();
    setHistory([]);
  }, []);

  return { history, loaded, refresh, clear };
}
