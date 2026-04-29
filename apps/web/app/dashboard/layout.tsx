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
    <div className="flex min-h-screen bg-[color:var(--color-bg-base)]">
      <DashboardSidebar email={session.user.email ?? ""} />
      <main className="flex-1 overflow-y-auto px-8 md:px-12 py-10">
        <div className="max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
