/**
 * app/dashboard/layout.tsx
 *
 * Shared layout for all /dashboard/* pages.
 * Renders the sidebar + main content area.
 * Server component — reads auth session to show owner email.
 */
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardSidebar from "./DashboardSidebar";

export const metadata = {
  title: "Dashboard — Sash",
  description: "Manage your Sash projects and API keys",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="dashboard-layout">
      <DashboardSidebar email={session.user.email ?? ""} />
      <main className="main-content">{children}</main>
    </div>
  );
}
