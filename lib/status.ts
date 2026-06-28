import { SubStatus } from "@/app/generated/prisma/client";

export type EffectiveStatus = SubStatus;

export const DEFAULT_EXPIRING_THRESHOLD = 30;
export const DEFAULT_URGENT_THRESHOLD = 7;

export type Thresholds = {
  expiring: number;
  urgent: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  expiring: DEFAULT_EXPIRING_THRESHOLD,
  urgent: DEFAULT_URGENT_THRESHOLD,
};

const URGENCY: Record<SubStatus, number> = {
  active: 1,
  expired: 2,
  cancelled: 0,
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Whole days from `now` until `renewalDate` (negative if already past).
 * Both sides are floored to local midnight so partial days don't skew the count.
 */
export function daysUntilRenewal(renewalDate: Date, now: Date = new Date()): number {
  return Math.floor(
    (startOfDay(renewalDate).getTime() - startOfDay(now).getTime()) / MS_PER_DAY,
  );
}

export function isWithinDays(
  renewalDate: Date | null,
  n: number,
  now: Date = new Date(),
): boolean {
  if (!renewalDate) return false;
  const days = daysUntilRenewal(renewalDate, now);
  return days >= 0 && days <= n;
}

/**
 * Resolves the lifecycle status shown across the app.
 *
 * Lifecycle is exactly active / expired / cancelled. "Expiring soon" is NOT a
 * lifecycle state — it's a derived flag over `active` rows (see isExpiringSoon),
 * so a subscription that renews soon is still active.
 *
 * Rules:
 * - `cancelled` is set manually and always wins.
 * - With no renewal date, the manual status stands.
 * - Otherwise the date can only *raise* urgency (past due -> expired), never
 *   lower it.
 */
export function computeEffectiveStatus(
  status: SubStatus,
  renewalDate: Date | null,
  now: Date = new Date(),
): EffectiveStatus {
  if (status === "cancelled") return "cancelled";
  if (!renewalDate) return status;

  const days = daysUntilRenewal(renewalDate, now);
  const dateStatus: SubStatus = days < 0 ? "expired" : "active";

  return URGENCY[dateStatus] > URGENCY[status] ? dateStatus : status;
}

/**
 * An active subscription whose renewal falls within `threshold` days (inclusive,
 * not past due). Derived — never stored. Expired/cancelled rows are never
 * "expiring soon".
 */
export function isExpiringSoon(
  effectiveStatus: EffectiveStatus,
  renewalDate: Date | null,
  threshold: number = DEFAULT_EXPIRING_THRESHOLD,
  now: Date = new Date(),
): boolean {
  if (effectiveStatus !== "active") return false;
  return isWithinDays(renewalDate, threshold, now);
}

/**
 * The tighter band inside "expiring soon" used for hot highlighting.
 */
export function isUrgent(
  effectiveStatus: EffectiveStatus,
  renewalDate: Date | null,
  threshold: number = DEFAULT_URGENT_THRESHOLD,
  now: Date = new Date(),
): boolean {
  if (effectiveStatus !== "active") return false;
  return isWithinDays(renewalDate, threshold, now);
}

/**
 * Suggests the next renewal date after a renewal action.
 * Returns currentRenewalDate + 1 month if it is still in the future,
 * otherwise today + 1 month. Always yields a future date.
 */
export function suggestNextRenewal(
  currentRenewalDate: Date | null,
  now: Date = new Date(),
): Date {
  const base =
    currentRenewalDate && daysUntilRenewal(currentRenewalDate, now) > 0
      ? currentRenewalDate
      : now;
  const next = new Date(base);
  next.setMonth(next.getMonth() + 1);
  return next;
}
