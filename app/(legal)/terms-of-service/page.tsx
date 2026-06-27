import type { Metadata } from "next";
import { SUPPORT_EMAIL, LAST_UPDATED, SectionHeading, Body } from "../_legal";

export const metadata: Metadata = {
  title: "Terms of Service — Subsify",
};

export default function TermsOfServicePage() {
  return (
    <article>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Subsify · Ikhsan Hadi Nugroho · Last updated {LAST_UPDATED}
        </p>
      </header>

      <SectionHeading>Acceptance of terms</SectionHeading>
      <Body>
        By accessing or using Subsify, you agree to be bound by these Terms of
        Service. If you do not agree, do not use the app.
      </Body>

      <SectionHeading>Permitted use</SectionHeading>
      <Body>
        Subsify is a tool for tracking software subscriptions, costs, and
        renewal dates for personal or internal business use. You may not use
        Subsify to store unlawful content, attempt unauthorized access to
        systems, or interfere with the service.
      </Body>

      <SectionHeading>Your account</SectionHeading>
      <Body>
        You are responsible for maintaining the confidentiality of your account
        credentials and for all activity that occurs under your account. Notify
        us immediately at{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-primary underline underline-offset-4"
        >
          {SUPPORT_EMAIL}
        </a>{" "}
        if you suspect unauthorized access.
      </Body>

      <SectionHeading>Data accuracy</SectionHeading>
      <Body>
        Subsify displays the data you enter. We do not verify, validate, or
        guarantee the accuracy of subscription information, costs, or dates. You
        are solely responsible for the accuracy of the data you input.
      </Body>

      <SectionHeading>No financial advice</SectionHeading>
      <Body>
        Subsify is not a financial service and does not provide financial,
        accounting, or legal advice. Cost figures shown in the app are for
        tracking purposes only and should not be used for official financial
        reporting without independent verification.
      </Body>

      <SectionHeading>Service availability</SectionHeading>
      <Body>
        Subsify is provided &ldquo;as is&rdquo; without warranty of any kind. We may modify,
        suspend, or discontinue the service at any time without notice. We are
        not liable for any loss resulting from service interruptions.
      </Body>

      <SectionHeading>Termination</SectionHeading>
      <Body>
        We reserve the right to suspend or terminate accounts that violate these
        terms. You may delete your account at any time by contacting us.
      </Body>

      <SectionHeading>Governing law</SectionHeading>
      <Body>
        These terms are governed by the laws of the Republic of Indonesia,
        without regard to conflict of law provisions.
      </Body>

      <SectionHeading>Changes to these terms</SectionHeading>
      <Body>
        We may update these terms from time to time. The &ldquo;last updated&rdquo; date at
        the top of this page reflects the most recent revision. Continued use of
        Subsify after changes constitutes acceptance of the updated terms.
      </Body>

      <SectionHeading>Contact</SectionHeading>
      <Body>
        Questions about these terms?{" "}
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
