import type { Metadata } from "next";
import { SUPPORT_EMAIL, LAST_UPDATED, Body } from "../_legal";

export const metadata: Metadata = {
  title: "Support — Subsify",
};

export default function SupportPage() {
  return (
    <article>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Subsify · Subscription & Renewal Tracker
        </p>
      </header>

      <Body>
        Subsify helps teams track software subscriptions, renewal dates, and
        monthly costs in one place. If you have a question or run into an issue,
        we&apos;re here to help.
      </Body>

      <Body>
        Email us at{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-primary underline underline-offset-4"
        >
          {SUPPORT_EMAIL}
        </a>
        . We aim to respond within 2 business days.
      </Body>

      <div className="mt-12 pt-5 border-t border-border">
        <p className="font-mono text-xs text-muted-foreground">
          Last updated · {LAST_UPDATED}
        </p>
      </div>
    </article>
  );
}
