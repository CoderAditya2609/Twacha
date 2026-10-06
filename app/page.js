"use client";
import { useEffect, useState } from "react";
import SiteShell from "@/components/SiteShell";
import LandingView from "@/components/landing/LandingView";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function Home() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    getSupabaseBrowser()
      .auth.getUser()
      .then(({ data }) => setSignedIn(!!data.user));
  }, []);
  return (
    <SiteShell flush>
      <LandingView signedIn={signedIn} />
    </SiteShell>
  );
}
