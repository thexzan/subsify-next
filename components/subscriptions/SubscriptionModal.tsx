"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import {
  SubscriptionForm,
  type SubscriptionFormValues,
} from "./SubscriptionForm";
import type { Subscription } from "@/lib/types";

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
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: SubscriptionFormValues) => {
      const payload = toPayload(values);
      const url = editing
        ? `/api/subscriptions/${editing.id}`
        : "/api/subscriptions";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
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
      toast.success(editing ? "Subscription updated" : "Subscription added");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const title = editing ? "Edit subscription" : "Add subscription";
  const description = editing
    ? "Update the details for this tool."
    : "Track a new tool and its renewal.";

  const form = (
    <SubscriptionForm
      key={editing?.id ?? "new"}
      departments={departments}
      initial={editing ?? undefined}
      submitting={mutation.isPending}
      onSubmit={(values) => mutation.mutate(values)}
      onCancel={() => onOpenChange(false)}
    />
  );

  return (
    <>
      {/* Mobile: bottom sheet */}
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="sm:hidden">
          <DrawerHeader className="mb-4">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          {form}
        </DrawerContent>
      </Drawer>

      {/* Desktop: centered dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="hidden sm:block sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    </>
  );
}
