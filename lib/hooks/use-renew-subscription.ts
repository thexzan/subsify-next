"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDate, type Subscription } from "@/lib/types";

export type RenewVars = { id: number; renewalDate: string };

/**
 * Records a renewal: advances the renewal date, reactivates the subscription,
 * and appends a renewal-history entry (server-side, atomic). Refreshes the
 * subscriptions list, dashboard stats, and that row's renewal history.
 *
 * Shared by the table's quick-renew dialog and the edit modal's inline renew so
 * both paths behave identically. `onSuccess` receives the updated subscription
 * (for re-syncing a form) plus the vars, and is the place for UI-local cleanup
 * (close a dialog, collapse the inline form).
 */
export function useRenewSubscription(options?: {
  onSuccess?: (updated: Subscription, vars: RenewVars) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, renewalDate }: RenewVars): Promise<Subscription> => {
      const res = await fetch(`/api/subscriptions/${id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renewalDate }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Failed to renew");
      }
      return res.json();
    },
    onSuccess: (updated, vars) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({
        queryKey: ["subscription", vars.id, "renewals"],
      });
      toast.success(`Renewed — next renewal on ${formatDate(vars.renewalDate)}`);
      options?.onSuccess?.(updated, vars);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { renew: mutation.mutate, isPending: mutation.isPending };
}
