export const SUPPORT_EMAIL = "ask-subsify@xzan.my.id";
export const LAST_UPDATED = "27 June 2026";

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h2>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-foreground">{children}</p>
  );
}
