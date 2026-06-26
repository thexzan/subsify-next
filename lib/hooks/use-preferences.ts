"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_EXPIRING_THRESHOLD,
  DEFAULT_URGENT_THRESHOLD,
} from "@/lib/status";

export type Preferences = {
  expiringThresholdDays: number;
  urgentThresholdDays: number;
};

export const DEFAULT_PREFERENCES: Preferences = {
  expiringThresholdDays: DEFAULT_EXPIRING_THRESHOLD,
  urgentThresholdDays: DEFAULT_URGENT_THRESHOLD,
};

/**
 * Per-user alert thresholds. Falls back to defaults while loading so callers can
 * read `.expiringThresholdDays` / `.urgentThresholdDays` unconditionally.
 */
export function usePreferences(): Preferences {
  const { data } = useQuery({
    queryKey: ["preferences"],
    queryFn: async () => {
      const res = await fetch("/api/auth/preferences");
      if (!res.ok) throw new Error("Failed to load preferences");
      return res.json() as Promise<Preferences>;
    },
    staleTime: 5 * 60_000,
  });
  return data ?? DEFAULT_PREFERENCES;
}
