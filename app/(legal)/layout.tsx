export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-[680px] px-4 sm:px-6 h-14 flex items-center">
          <span className="text-sm font-semibold tracking-tight">Subsify</span>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 mx-auto w-full max-w-[680px] px-4 sm:px-6 py-10 sm:py-14">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-[680px] px-4 sm:px-6 py-5">
          <p className="font-mono text-xs text-muted-foreground">
            Subsify · Ikhsan Hadi Nugroho
          </p>
        </div>
      </footer>
    </div>
  );
}
