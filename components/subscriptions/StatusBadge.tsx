import type { SubStatus } from "@/app/generated/prisma/client";
import { cn } from "@/lib/utils";

const STATUS_META: Record<SubStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-calm/15 text-calm border-calm/30",
  },
  expired: {
    label: "Expired",
    className: "bg-hot/15 text-hot border-hot/30",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-dead/15 text-dead border-dead/30",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: SubStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        meta.className,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

/**
 * Secondary badge shown alongside StatusBadge when an active subscription is
 * approaching renewal. Makes the row highlight self-explanatory.
 */
export function UrgencyBadge({
  urgent,
  className,
}: {
  urgent: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        urgent
          ? "border-hot/30 bg-hot/15 text-hot"
          : "border-warn/30 bg-warn/15 text-warn",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {urgent ? "Urgent" : "Expiring soon"}
    </span>
  );
}
