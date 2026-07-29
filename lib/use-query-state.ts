"use client";

import { useCallback, useState } from "react";

/**
 * Client-only filter state that mirrors into the URL query string via the
 * native History API (no Next.js router navigation, so no server round-trip
 * on every keystroke) — purely so the value survives back/forward and reloads.
 */
export function useQueryState(key: string, defaultValue: string) {
  const [value, setValueState] = useState(() => {
    if (typeof window === "undefined") return defaultValue;
    return new URLSearchParams(window.location.search).get(key) ?? defaultValue;
  });

  const setValue = useCallback(
    (next: string) => {
      setValueState(next);
      const params = new URLSearchParams(window.location.search);
      if (next === defaultValue || next === "") {
        params.delete(key);
      } else {
        params.set(key, next);
      }
      const qs = params.toString();
      const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState(window.history.state, "", url);
    },
    [key, defaultValue]
  );

  return [value, setValue] as const;
}
