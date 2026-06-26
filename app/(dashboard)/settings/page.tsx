"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePreferences, DEFAULT_PREFERENCES } from "@/lib/hooks/use-preferences";

const formSchema = z
  .object({
    expiringThresholdDays: z.coerce.number().int().min(1).max(365),
    urgentThresholdDays: z.coerce.number().int().min(1).max(365),
  })
  .refine((v) => v.urgentThresholdDays <= v.expiringThresholdDays, {
    message: "Urgent window must be within the expiring window",
    path: ["urgentThresholdDays"],
  });

type FormValues = z.input<typeof formSchema>;

export default function SettingsPage() {
  const prefs = usePreferences();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_PREFERENCES,
    values: prefs,
  });

  // Keep the form in sync once preferences load.
  useEffect(() => {
    reset(prefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.expiringThresholdDays, prefs.urgentThresholdDays]);

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch("/api/auth/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Failed to save preferences");
      }
      const updated = await res.json();
      queryClient.setQueryData(["preferences"], updated);
      // Status buckets, highlights and counts all depend on the thresholds.
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      reset(updated);
      toast.success("Preferences saved");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tune when subscriptions are flagged as expiring soon.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="expiringThresholdDays">Expiring soon window (days)</Label>
            <Input
              id="expiringThresholdDays"
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              className="h-11 sm:max-w-40"
              {...register("expiringThresholdDays")}
            />
            <p className="text-xs text-muted-foreground">
              Active subscriptions renewing within this many days are flagged as
              expiring soon.
            </p>
            {errors.expiringThresholdDays && (
              <p className="text-xs text-destructive">
                {errors.expiringThresholdDays.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgentThresholdDays">Urgent window (days)</Label>
            <Input
              id="urgentThresholdDays"
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              className="h-11 sm:max-w-40"
              {...register("urgentThresholdDays")}
            />
            <p className="text-xs text-muted-foreground">
              Renewals within this tighter window are highlighted in red.
            </p>
            {errors.urgentThresholdDays && (
              <p className="text-xs text-destructive">
                {errors.urgentThresholdDays.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
