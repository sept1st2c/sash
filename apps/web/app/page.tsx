/**
 * app/page.tsx (root)
 * Redirects to /dashboard if logged in. Otherwise renders the marketing
 * landing page instead of forcing a redirect to /login.
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import FeatureGrid from "@/components/landing/FeatureGrid";
import ProblemSolution from "@/components/landing/ProblemSolution";
import ArchitectureDiagram from "@/components/landing/ArchitectureDiagram";
import EndpointShowcase from "@/components/landing/EndpointShowcase";
import LiveDemo from "@/components/landing/LiveDemo";
import Footer from "@/components/landing/Footer";

export default async function RootPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="wise-theme">
      <Nav />
      <Hero />
      <FeatureGrid />
      <ArchitectureDiagram />
      <ProblemSolution />
      <EndpointShowcase />
      <LiveDemo />
      <Footer />
    </div>
  );
}
