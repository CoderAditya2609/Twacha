import SiteShell from "@/components/SiteShell";
import ChatClient from "@/components/ChatClient";

export default function Chat() {
  return (
    <SiteShell>
      <main className="page flush" style={{ width: "100%", maxWidth: "none", padding: 0 }}>
        <ChatClient />
      </main>
    </SiteShell>
  );
}
