import type { SerializedSubscription } from "./serialize";
import type { Stats } from "./types";
import { SUB_STATUS_VALUES } from "./validation";

export type SubscriptionFilters = {
  status?: string | null;
  search?: string | null;
  department?: string | null;
};

/**
 * Filters serialized subscriptions by effective status, free-text search
 * (tool name or department), and exact department. Pure: no DB, no clock.
 */
export function filterSubscriptions(
  rows: SerializedSubscription[],
  filters: SubscriptionFilters,
): SerializedSubscription[] {
  let result = rows;

  const status = filters.status?.trim();
  if (status && SUB_STATUS_VALUES.includes(status as never)) {
    result = result.filter((s) => s.effectiveStatus === status);
  }

  const department = filters.department?.trim();
  if (department) {
    result = result.filter((s) => s.department === department);
  }

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    result = result.filter(
      (s) =>
        s.toolName.toLowerCase().includes(search) ||
        s.department.toLowerCase().includes(search),
    );
  }

  return result;
}

/**
 * Aggregates dashboard stats from serialized subscriptions. Counts use the
 * effective status (so they sum to total); monthly cost includes only
 * subscriptions still being paid (active or expiring_soon).
 */
export function computeStats(rows: SerializedSubscription[]): Stats {
  const stats: Stats = {
    total: rows.length,
    active: 0,
    expiring_soon: 0,
    expired: 0,
    cancelled: 0,
    total_monthly_cost: 0,
  };

  for (const s of rows) {
    stats[s.effectiveStatus] += 1;
    if (s.effectiveStatus === "active" || s.effectiveStatus === "expiring_soon") {
      stats.total_monthly_cost += s.monthlyCost;
    }
  }

  return stats;
}
