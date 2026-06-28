"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SubscriptionForm,
  type SubscriptionFormValues,
} from "./SubscriptionForm";
import type { Subscription } from "@/lib/types";
import { RenewalHistoryList } from "./RenewalHistoryList";
import { suggestNextRenewal } from "@/lib/status";
import { useRenewSubscription } from "@/lib/hooks/use-renew-subscription";

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

function toPayload(values: SubscriptionFormValues) {
  return {
    toolName: values.toolName,
    department: values.department,
    renewalDate: values.renewalDate ? values.renewalDate : null,
    monthlyCost: values.monthlyCost,
    status: values.status,
    notes: values.notes ?? null,
  };
}

/**
 * Form + renewal-history body. The parent remounts this (via `key`) whenever a
 * different subscription — or a newer version of the same one (`updatedAt`) — is
 * opened, so all local state resets cleanly without syncing props into state.
 * An inline renew updates `local` in place, which does NOT remount, so the panel
 * stays open and the form re-keys to the new date.
 */
function SubscriptionModalBody({
  editing,
  departments,
  isMobile,
  onOpenChange,
}: {
  editing: Subscription | null;
  departments: string[];
  isMobile: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<Subscription | null>(editing);
  const [renewing, setRenewing] = useState(false);
  const [renewDate, setRenewDate] = useState("");

  const { renew, isPending: isRenewing } = useRenewSubscription({
    onSuccess: (updated) => {
      setLocal(updated);
      setRenewing(false);
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: SubscriptionFormValues) => {
      const payload = toPayload(values);
      const url = local ? `/api/subscriptions/${local.id}` : "/api/subscriptions";
      const res = await fetch(url, {
        method: local ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Request failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(local ? "Subscription updated" : "Subscription added");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const form = (
    <SubscriptionForm
      // Re-key on the renewal date/status so an inline renew refreshes the
      // fields to the new server truth instead of showing the stale date.
      key={local ? `${local.id}-${local.renewalDate}-${local.status}` : "new"}
      departments={departments}
      initial={local ?? undefined}
      submitting={mutation.isPending}
      onSubmit={(values) => mutation.mutate(values)}
      onCancel={() => onOpenChange(false)}
    />
  );

  const startRenew = () => {
    if (!local) return;
    const suggested = suggestNextRenewal(
      local.renewalDate ? new Date(local.renewalDate) : null,
    );
    setRenewDate(suggested.toISOString().slice(0, 10));
    setRenewing(true);
  };

  const canRenew =
    local && local.effectiveStatus !== "cancelled" && !!local.renewalDate;

  const historySection = local && (
    <div className="mt-2 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Renewal history</p>
        {canRenew && !renewing && (
          <Button variant="outline" size="sm" onClick={startRenew}>
            <CalendarCheck className="h-4 w-4" />
            Mark as renewed
          </Button>
        )}
      </div>

      {renewing && (
        <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <Label htmlFor="inline-renew-date">Next renewal date</Label>
          <Input
            id="inline-renew-date"
            type="date"
            value={renewDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setRenewDate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Records a renewal and moves the date forward.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRenewing(false)}
              disabled={isRenewing}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => renew({ id: local.id, renewalDate: renewDate })}
              disabled={!renewDate || isRenewing}
            >
              {isRenewing ? "Saving…" : "Confirm renewal"}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3">
        <RenewalHistoryList subscriptionId={local.id} />
      </div>
    </div>
  );

  return (
    <>
      {form}
      {historySection &&
        (isMobile ? <div className="px-4 pb-6">{historySection}</div> : historySection)}
    </>
  );
}

export function SubscriptionModal({
  open,
  onOpenChange,
  editing,
  departments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Subscription | null;
  departments: string[];
}) {
  const isMobile = useIsMobile();

  const title = editing ? "Edit subscription" : "Add subscription";
  const description = editing
    ? "Update the details for this tool."
    : "Track a new tool and its renewal.";

  // Remount the body when a different subscription — or a newer version of the
  // same one — is opened. `updatedAt` changes on every server mutation, so
  // reopening after a renew shows fresh data rather than stale local state.
  const body = (
    <SubscriptionModalBody
      key={editing ? `${editing.id}-${editing.updatedAt}` : "new"}
      editing={editing}
      departments={departments}
      isMobile={isMobile}
      onOpenChange={onOpenChange}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="mb-4">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          {body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
