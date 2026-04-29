/**
 * app/page.tsx (root)
 * Redirects to /dashboard if logged in, otherwise to /login.
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  redirect("/login");
}
