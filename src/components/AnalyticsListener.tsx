"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { logEvent } from "firebase/analytics";
import { getFirebaseAnalytics } from "@/lib/firebase";

export function AnalyticsListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    getFirebaseAnalytics().then((analytics) => {
      if (!analytics || cancelled) return;
      logEvent(analytics, "page_view", {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  return null;
}
