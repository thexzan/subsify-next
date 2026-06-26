"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUB_STATUS_VALUES } from "@/lib/validation";
import type { Subscription } from "@/lib/types";

const formSchema = z.object({
  toolName: z.string().trim().min(1, "Tool name is required").max(100),
  department: z.string().trim().min(1, "Department is required").max(100),
  renewalDate: z.string().optional(),
  monthlyCost: z
    .number({ message: "Cost is required" })
    .nonnegative("Cost must be zero or positive"),
  status: z.enum(SUB_STATUS_VALUES),
  notes: z.string().max(5000).optional(),
});

export type SubscriptionFormValues = z.infer<typeof formSchema>;

const STATUS_LABELS: Record<(typeof SUB_STATUS_VALUES)[number], string> = {
  active: "Active",
  expiring_soon: "Expiring soon",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function SubscriptionForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Subscription;
  submitting: boolean;
  onSubmit: (values: SubscriptionFormValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toolName: initial?.toolName ?? "",
      department: initial?.department ?? "",
      renewalDate: initial?.renewalDate ?? "",
      monthlyCost: initial?.monthlyCost ?? 0,
      status: initial?.status ?? "active",
      notes: initial?.notes ?? "",
    },
  });

  const status = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="toolName">Tool name</Label>
          <Input id="toolName" placeholder="Notion" autoFocus {...register("toolName")} />
          {errors.toolName && (
            <p className="text-xs text-destructive">{errors.toolName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            placeholder="Engineering"
            {...register("department")}
          />
          {errors.department && (
            <p className="text-xs text-destructive">{errors.department.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="renewalDate">Renewal date</Label>
          <Input id="renewalDate" type="date" {...register("renewalDate")} />
          <p className="text-xs text-muted-foreground">
            Leave empty for cancelled tools.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthlyCost">Monthly cost (IDR)</Label>
          <Input
            id="monthlyCost"
            type="number"
            min={0}
            step={1000}
            placeholder="160000"
            {...register("monthlyCost", { valueAsNumber: true })}
          />
          {errors.monthlyCost && (
            <p className="text-xs text-destructive">{errors.monthlyCost.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={status}
          onValueChange={(v) =>
            setValue("status", v as SubscriptionFormValues["status"])
          }
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUB_STATUS_VALUES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder="Optional notes…"
          {...register("notes")}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Add subscription"}
        </Button>
      </div>
    </form>
  );
}
