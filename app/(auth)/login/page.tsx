"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}

function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    const res = await signIn("credentials", {
      ...values,
      redirect: false,
    });
    setSubmitting(false);

    if (res?.error) {
      toast.error("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left: the signature — a renewal runway rendered as ambient brand */}
      <aside className="relative hidden overflow-hidden bg-[#0e1320] lg:block">
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-lg font-semibold tracking-tight text-[#e6eaf2]">
              Subsify
            </span>
          </div>

          <div className="space-y-6">
            <p className="max-w-sm text-2xl font-medium leading-snug tracking-tight text-[#e6eaf2]">
              Every renewal, on one timeline.
              <span className="block text-[#8a95ac]">
                Know what&apos;s due before it bills.
              </span>
            </p>
            <RenewalRunway />
          </div>

          <p className="font-mono text-xs text-[#5b6678]">
            INTERNAL · TOOLS &amp; SUBSCRIPTIONS
          </p>
        </div>
      </aside>

      {/* Right: the form */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">Subsify</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Use your admin credentials to access the dashboard.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Logo() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 7v5l3 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
  );
}

// Ambient version of the dashboard's signature: a time ruler with renewal dots.
function RenewalRunway() {
  const marks = [
    { left: "8%", color: "#ff6b5e", label: "3d" },
    { left: "26%", color: "#f5b544", label: "12d" },
    { left: "44%", color: "#f5b544", label: "25d" },
    { left: "72%", color: "#3fb984", label: "60d" },
    { left: "90%", color: "#3fb984", label: "90d" },
  ];
  return (
    <div className="max-w-md">
      <div className="relative h-px w-full bg-[#2a3548]">
        {marks.map((m) => (
          <div
            key={m.left}
            className="absolute -top-1.5 flex flex-col items-center"
            style={{ left: m.left }}
          >
            <span
              className="h-3 w-3 rounded-full ring-4"
              style={{
                backgroundColor: m.color,
                // @ts-expect-error ring color via inline style
                "--tw-ring-color": "#0e1320",
              }}
            />
            <span className="mt-2 font-mono text-[10px] text-[#5b6678]">
              {m.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-between font-mono text-[10px] uppercase tracking-wider text-[#5b6678]">
        <span>Today</span>
        <span>+90 days</span>
      </div>
    </div>
  );
}
