import type { SerializedSubscription } from "@/lib/serialize";

export type Subscription = SerializedSubscription;

export type Stats = {
  total: number;
  active: number;
  expiring_soon: number;
  expired: number;
  cancelled: number;
  total_monthly_cost: number;
};

const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatIDR(value: number): string {
  return IDR.format(value);
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return DATE_FMT.format(new Date(iso));
}
