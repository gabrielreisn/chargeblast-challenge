"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TIME_ZONE_COOKIE } from "./format";

const ONE_YEAR_SECONDS = 31_536_000;

function readCookie(name: string) {
  const prefix = `${name}=`;
  const entry = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

type TimeZoneSyncProps = { renderedTimeZone: string };

/**
 * The server can only guess the time zone (from Vercel's IP geolocation) until the browser
 * reports its own. When the page was rendered in another zone, store the browser's in a cookie
 * and refresh once so server components re-render with it.
 */
export function TimeZoneSync({ renderedTimeZone }: TimeZoneSyncProps) {
  const router = useRouter();
  useEffect(
    function adoptBrowserTimeZone() {
      const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!browserTimeZone || browserTimeZone === renderedTimeZone) return;
      // Already stored but still not rendered: the server rejected it. Don't refresh in a loop.
      if (readCookie(TIME_ZONE_COOKIE) === browserTimeZone) return;
      document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(browserTimeZone)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
      router.refresh();
    },
    [renderedTimeZone, router],
  );
  return null;
}
