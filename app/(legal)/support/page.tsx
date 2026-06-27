import type { Metadata } from "next";
import { SUPPORT_EMAIL, LAST_UPDATED, SectionHeading, Body } from "../_legal";

export const metadata: Metadata = {
  title: "Support — Subsify",
};

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: React.ReactNode;
}) {
  return (
    <div className="py-4 border-b border-border last:border-0">
      <p className="text-sm font-medium text-foreground mb-1">{question}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{answer}</p>
    </div>
  );
}

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
        we're here to help.
      </Body>

      <SectionHeading>Contact us</SectionHeading>
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

      <SectionHeading>Frequently asked questions</SectionHeading>

      <div className="mt-1 rounded-xl border border-border bg-card px-4">
        <FaqItem
          question="How do I reset my password?"
          answer={
            <>
              Email us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              with the subject "Reset my password" and we will assist you.
            </>
          }
        />
        <FaqItem
          question="How do I delete my account?"
          answer={
            <>
              Send an email to{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              with the subject "Delete my account" from your registered email
              address. We will permanently remove your account and all associated
              data within 5 business days.
            </>
          }
        />
        <FaqItem
          question="How do I update my subscription data?"
          answer="Open the subscription from the dashboard and tap the edit icon. Changes are saved immediately."
        />
        <FaqItem
          question="Can I export my subscription data?"
          answer="Data export is not currently available. Contact us at ask-subsify@xzan.my.id if you need a copy of your data."
        />
        <FaqItem
          question="Who do I contact for billing or account issues?"
          answer={
            <>
              Subsify does not process payments — it is a tracking tool only.
              For account issues, email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </>
          }
        />
      </div>

      <div className="mt-12 pt-5 border-t border-border">
        <p className="font-mono text-xs text-muted-foreground">
          Last updated · {LAST_UPDATED}
        </p>
      </div>
    </article>
  );
}
