import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SubscriptionModalProvider } from "@/components/subscriptions/SubscriptionModalProvider";
import { QuickAddFab } from "@/components/subscriptions/QuickAddFab";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionModalProvider>
      <DashboardShell>{children}</DashboardShell>
      <QuickAddFab />
    </SubscriptionModalProvider>
  );
}
