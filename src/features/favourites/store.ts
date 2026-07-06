import { useCallback, useEffect, useState } from "react";
import { deleteCookie, getCookie, setCookie } from "../../lib/cookies";

const COOKIE = "fifa-ranking:favourite-team";
const EVENT = "fifa-ranking:favourite-team-change";

function read(): string | null {
  return getCookie(COOKIE);
}

function write(code: string | null): void {
  if (code === null || code === "") {
    deleteCookie(COOKIE);
  } else {
    setCookie(COOKIE, code);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<string | null>(EVENT, { detail: code }));
  }
}

/**
 * Reads and sets the user's favourite team code. Backed by a cookie so
 * it survives across sessions and can be picked up by SSR later. All
 * mounted subscribers stay in sync via a window CustomEvent.
 */
export function useFavouriteTeam(): [string | null, (code: string | null) => void] {
  const [code, setCode] = useState<string | null>(read);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string | null>).detail ?? null;
      setCode(detail);
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const set = useCallback((next: string | null) => {
    write(next);
    // write() dispatches, but call setCode directly too so React
    // schedules the update before the event loop tick.
    setCode(next);
  }, []);

  return [code, set];
}
