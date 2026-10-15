import { Suspense } from "react";
import SiteShell from "@/components/SiteShell";
import ChatClient from "@/components/ChatClient";

export default function Chat() {
  return (
    <SiteShell>
      <main className="page flush" style={{ width: "100%", maxWidth: "none", padding: "22px 0 34px" }}>
        <Suspense fallback={null}>
          <ChatClient />
        </Suspense>
      </main>
    </SiteShell>
  );
}
