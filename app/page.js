"use client";
import SiteShell from "@/components/SiteShell";
import LandingView from "@/components/landing/LandingView";

export default function Home() {
  return (
    <SiteShell flush>
      <LandingView />
    </SiteShell>
  );
}
