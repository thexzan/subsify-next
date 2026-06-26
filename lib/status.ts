import { SubStatus } from "@/app/generated/prisma/client";

export type EffectiveStatus = SubStatus;

const URGENCY: Record<SubStatus, number> = {
  active: 1,
  expiring_soon: 2,
  expired: 3,
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
 * Resolves the status shown across the app.
 *
 * Rules:
 * - `cancelled` is set manually and always wins.
 * - With no renewal date, the manual status stands.
 * - Otherwise the date can only *raise* urgency (past due -> expired,
 *   within 30 days -> expiring_soon), never lower it. This keeps each row
 *   in exactly one bucket so summary cards never double-count.
 */
export function computeEffectiveStatus(
  status: SubStatus,
  renewalDate: Date | null,
  now: Date = new Date(),
): EffectiveStatus {
  if (status === "cancelled") return "cancelled";
  if (!renewalDate) return status;

  const days = daysUntilRenewal(renewalDate, now);
  const dateStatus: SubStatus =
    days < 0 ? "expired" : days <= 30 ? "expiring_soon" : "active";

  return URGENCY[dateStatus] > URGENCY[status] ? dateStatus : status;
}
