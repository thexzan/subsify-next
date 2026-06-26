"use client";

import { useMemo, useState } from "react";
import type { Subscription } from "@/lib/types";
import { formatIDR } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/lib/hooks/use-preferences";

export function RenewalRadar({ subscriptions }: { subscriptions: Subscription[] }) {
  const { expiringThresholdDays, urgentThresholdDays } = usePreferences();
  const windowDays = expiringThresholdDays;
  const [hovered, setHovered] = useState<number | null>(null);

  const toneFor = (days: number): string =>
    days <= urgentThresholdDays ? "var(--hot)" : "var(--warn)";

  const upcoming = useMemo(() => {
    return subscriptions
      .filter((s) => s.renewalDate && s.effectiveStatus !== "cancelled")
      .map((s) => ({ sub: s, days: s.daysUntilRenewal ?? 0 }))
      .filter((x) => x.days >= 0 && x.days <= windowDays)
      .sort((a, b) => a.days - b.days);
  }, [subscriptions, windowDays]);

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Renewal radar</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Renewals in the next {windowDays} days
          </p>
        </div>
        <span className="tabular text-xs font-medium text-muted-foreground">
          {upcoming.length} due
        </span>
      </div>

      {upcoming.length === 0 ? (
        <p className="mt-8 mb-4 text-center text-sm text-muted-foreground">
          Nothing due in the next {windowDays} days. You&apos;re clear.
        </p>
      ) : (
        <>
          {/* Desktop: time ruler */}
          <div className="mt-10 hidden sm:block">
            <div className="relative h-px w-full bg-border">
              {/* urgent-window marker */}
              <div
                className="absolute -top-2 h-2 w-px bg-hot/40"
                style={{ left: `${(urgentThresholdDays / windowDays) * 100}%` }}
              />
              {upcoming.map(({ sub, days }) => {
                const left = `${Math.min((days / windowDays) * 100, 98)}%`;
                return (
                  <button
                    key={sub.id}
                    className="absolute -top-1.5 flex -translate-x-1/2 flex-col items-center focus:outline-none"
                    style={{ left }}
                    onMouseEnter={() => setHovered(sub.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(sub.id)}
                    onBlur={() => setHovered(null)}
                  >
                    <span
                      className="h-3 w-3 rounded-full ring-4 ring-card transition-transform hover:scale-125"
                      style={{ backgroundColor: toneFor(days) }}
                    />
                    {hovered === sub.id && (
                      <span className="absolute bottom-5 z-10 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-lg">
                        <span className="font-medium">{sub.toolName}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {formatIDR(sub.monthlyCost)}/mo
                        </span>
                      </span>
                    )}
                    <span className="tabular mt-2 font-mono text-[10px] text-muted-foreground">
                      {days}d
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Today</span>
              <span>+{windowDays} days</span>
            </div>
          </div>

          {/* Mobile: ordered list */}
          <ul className="mt-4 flex flex-col divide-y divide-border sm:hidden">
            {upcoming.map(({ sub, days }) => (
              <li key={sub.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: toneFor(days) }}
                  />
                  <span className="text-sm font-medium">{sub.toolName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {formatIDR(sub.monthlyCost)}
                  </span>
                  <span
                    className={cn(
                      "tabular font-mono text-xs",
                      days <= urgentThresholdDays ? "text-hot" : "text-warn",
                    )}
                  >
                    {days}d
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
