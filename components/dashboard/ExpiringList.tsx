"use client";

import { daysUntilRenewal } from "@/lib/status";
import { formatIDR, type Subscription } from "@/lib/types";
import { StatusBadge } from "@/components/subscriptions/StatusBadge";

export function ExpiringList({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  const now = new Date();
  const expiring = subscriptions
    .filter((s) => s.effectiveStatus === "expiring_soon" && s.renewalDate)
    .map((s) => ({ sub: s, days: daysUntilRenewal(new Date(s.renewalDate!), now) }))
    .sort((a, b) => a.days - b.days);

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Expiring soon</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Subscriptions renewing within 30 days
          </p>
        </div>
        <span className="tabular text-xs font-medium text-muted-foreground">
          {expiring.length}
        </span>
      </div>

      {expiring.length === 0 ? (
        <p className="mt-8 mb-4 text-center text-sm text-muted-foreground">
          Nothing expiring in the next 30 days.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-border">
          {expiring.map(({ sub, days }) => (
            <li
              key={sub.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{sub.toolName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {sub.department}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="tabular hidden text-sm text-muted-foreground sm:inline">
                  {formatIDR(sub.monthlyCost)}
                </span>
                <span
                  className={
                    "tabular font-mono text-xs " +
                    (days <= 7 ? "text-hot" : "text-warn")
                  }
                >
                  {days}d
                </span>
                <StatusBadge status={sub.effectiveStatus} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
