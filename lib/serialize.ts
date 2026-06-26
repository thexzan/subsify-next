import type { Subscription } from "@/app/generated/prisma/client";
import { computeEffectiveStatus, type EffectiveStatus } from "./status";

export type SerializedSubscription = {
  id: number;
  toolName: string;
  department: string;
  renewalDate: string | null;
  monthlyCost: number;
  status: Subscription["status"];
  effectiveStatus: EffectiveStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeSubscription(
  sub: Subscription,
  now: Date = new Date(),
): SerializedSubscription {
  return {
    id: sub.id,
    toolName: sub.toolName,
    department: sub.department,
    renewalDate: sub.renewalDate ? sub.renewalDate.toISOString().slice(0, 10) : null,
    monthlyCost: Number(sub.monthlyCost),
    status: sub.status,
    effectiveStatus: computeEffectiveStatus(sub.status, sub.renewalDate, now),
    notes: sub.notes,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
  };
}
