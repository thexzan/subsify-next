import type { SerializedSubscription } from "./serialize";
import type { Stats } from "./types";
import { SUB_STATUS_VALUES } from "./validation";
import { DEFAULT_EXPIRING_THRESHOLD } from "./status";

export type SubscriptionFilters = {
  status?: string | null;
  search?: string | null;
  department?: string | null;
};

/**
 * Derived "expiring soon" over a serialized row: still active and renewing
 * within `threshold` days (inclusive, not past due). Pure — uses the
 * precomputed `daysUntilRenewal`, so no clock dependency here.
 */
export function isRowExpiringSoon(
  row: SerializedSubscription,
  threshold: number = DEFAULT_EXPIRING_THRESHOLD,
): boolean {
  if (row.effectiveStatus !== "active") return false;
  const days = row.daysUntilRenewal;
  return days !== null && days >= 0 && days <= threshold;
}

/**
 * Filters serialized subscriptions by status, free-text search (tool name or
 * department), and exact department. Pure: no DB, no clock.
 *
 * Status is two-dimensional: lifecycle values (active/expired/cancelled) match
 * `effectiveStatus`, while the special "expiring_soon" filter is a subset of
 * active rows renewing within `threshold` days. Filtering by "active" therefore
 * includes the expiring-soon rows.
 */
export function filterSubscriptions(
  rows: SerializedSubscription[],
  filters: SubscriptionFilters,
  threshold: number = DEFAULT_EXPIRING_THRESHOLD,
): SerializedSubscription[] {
  let result = rows;

  const status = filters.status?.trim();
  if (status === "expiring_soon") {
    result = result.filter((s) => isRowExpiringSoon(s, threshold));
  } else if (status && SUB_STATUS_VALUES.includes(status as never)) {
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
 * Aggregates dashboard stats from serialized subscriptions. `active` counts all
 * active rows (including expiring-soon, since those are still active);
 * `expiring_soon` is a subset count of those. `total = active + expired +
 * cancelled` with no double-counting. Monthly cost includes everything still
 * being paid (active, which already covers expiring-soon).
 */
export function computeStats(
  rows: SerializedSubscription[],
  threshold: number = DEFAULT_EXPIRING_THRESHOLD,
): Stats {
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
    if (s.effectiveStatus === "active") {
      stats.total_monthly_cost += s.monthlyCost;
      if (isRowExpiringSoon(s, threshold)) stats.expiring_soon += 1;
    }
  }

  return stats;
}
