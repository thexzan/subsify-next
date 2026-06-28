import type { Subscription, RenewalHistory } from "@/app/generated/prisma/client";
import { computeEffectiveStatus, daysUntilRenewal, type EffectiveStatus } from "./status";

export type SerializedSubscription = {
  id: number;
  toolName: string;
  department: string;
  renewalDate: string | null;
  monthlyCost: number;
  status: Subscription["status"];
  effectiveStatus: EffectiveStatus;
  daysUntilRenewal: number | null;
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
    daysUntilRenewal: sub.renewalDate ? daysUntilRenewal(sub.renewalDate, now) : null,
    notes: sub.notes,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
  };
}

export type SerializedRenewal = {
  id: number;
  subscriptionId: number;
  previousRenewalDate: string | null;
  newRenewalDate: string;
  costSnapshot: number;
  previousStatus: string;
  renewedAt: string;
};

export function serializeRenewal(renewal: RenewalHistory): SerializedRenewal {
  return {
    id: renewal.id,
    subscriptionId: renewal.subscriptionId,
    previousRenewalDate: renewal.previousRenewalDate
      ? renewal.previousRenewalDate.toISOString().slice(0, 10)
      : null,
    newRenewalDate: renewal.newRenewalDate.toISOString().slice(0, 10),
    costSnapshot: Number(renewal.costSnapshot),
    previousStatus: renewal.previousStatus,
    renewedAt: renewal.renewedAt.toISOString(),
  };
}
