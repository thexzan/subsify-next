"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export function AccountModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: session, update } = useSession();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>
            Update your profile and password.
          </DialogDescription>
        </DialogHeader>

        <ProfileSection
          key={`${session?.user?.name}-${session?.user?.email}`}
          name={session?.user?.name ?? ""}
          email={session?.user?.email ?? ""}
          onUpdated={() => update()}
        />

        <Separator />

        <PasswordSection onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Separator() {
  return <div className="-mx-4 border-t border-border" />;
}

function ProfileSection({
  name,
  email,
  onUpdated,
}: {
  name: string;
  email: string;
  onUpdated: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, email },
  });

  async function onSubmit(values: ProfileValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Failed to update profile");
      }
      toast.success("Profile updated");
      onUpdated();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm font-medium">Profile</p>
      <div className="space-y-2">
        <Label htmlFor="acct-name">Name</Label>
        <Input id="acct-name" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="acct-email">Email</Label>
        <Input id="acct-email" type="email" {...register("email")} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting || !isDirty}>
          {submitting ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

function PasswordSection({ onDone }: { onDone: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: PasswordValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Failed to change password");
      }
      toast.success("Password changed");
      reset();
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm font-medium">Change password</p>
      <div className="space-y-2">
        <Label htmlFor="acct-current">Current password</Label>
        <Input
          id="acct-current"
          type="password"
          autoComplete="current-password"
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-xs text-destructive">
            {errors.currentPassword.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="acct-new">New password</Label>
        <Input
          id="acct-new"
          type="password"
          autoComplete="new-password"
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <p className="text-xs text-destructive">{errors.newPassword.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="acct-confirm">Confirm new password</Label>
        <Input
          id="acct-confirm"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Saving…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
