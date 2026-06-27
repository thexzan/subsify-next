import type { Metadata } from "next";
import { SUPPORT_EMAIL, LAST_UPDATED, SectionHeading, Body } from "../_legal";

export const metadata: Metadata = {
  title: "Privacy Policy — Subsify",
};

export default function PrivacyPolicyPage() {
  return (
    <article>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Subsify · Ikhsan Hadi Nugroho · Last updated {LAST_UPDATED}
        </p>
      </header>

      <SectionHeading>Information we collect</SectionHeading>
      <Body>
        When you create an account, we collect your name and email address. Your
        password is stored as a one-way hash — we never store or transmit your
        plaintext password. When you add subscriptions, we store the details you
        provide: tool name, department, renewal date, monthly cost, status, and
        any notes you include.
      </Body>

      <SectionHeading>How we use your data</SectionHeading>
      <Body>
        Your data is used solely to provide the Subsify service — to display,
        filter, and track your subscriptions. We do not use your data for
        advertising, profiling, or any purpose beyond operating the app.
      </Body>

      <SectionHeading>Data sharing</SectionHeading>
      <Body>
        We do not sell, rent, or share your personal data with third parties. We
        do not use third-party analytics, advertising networks, or tracking
        services.
      </Body>

      <SectionHeading>Data retention</SectionHeading>
      <Body>
        Your data is retained for as long as your account is active. When you
        delete your account, all associated data is permanently removed from our
        systems.
      </Body>

      <SectionHeading>Your rights</SectionHeading>
      <Body>
        You have the right to access, correct, or delete your personal data at
        any time. To exercise these rights, contact us at{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-primary underline underline-offset-4"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </Body>

      <SectionHeading>Security</SectionHeading>
      <Body>
        We use industry-standard measures to protect your data, including hashed
        passwords and HTTPS transport. No system is perfectly secure; if you
        believe your account has been compromised, contact us immediately.
      </Body>

      <SectionHeading>Changes to this policy</SectionHeading>
      <Body>
        We may update this policy from time to time. The &ldquo;last updated&rdquo; date at
        the top of this page reflects the most recent revision. Continued use of
        Subsify after changes are posted constitutes acceptance of the updated
        policy.
      </Body>

      <SectionHeading>Contact</SectionHeading>
      <Body>
        Questions about this policy?{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-primary underline underline-offset-4"
        >
          {SUPPORT_EMAIL}
        </a>
      </Body>

      <div className="mt-12 pt-5 border-t border-border">
        <p className="font-mono text-xs text-muted-foreground">
          Last updated · {LAST_UPDATED}
        </p>
      </div>
    </article>
  );
}
