import SiteShell from "@/components/SiteShell";
import AdminClient from "@/components/AdminClient";

export default function Admin() {
  return (
    <SiteShell>
      <main className="page">
        <div className="eyebrow">Assignment dashboard</div>
        <h1>Hypothetical affiliate earnings</h1>
        <p className="notice">This is a demonstration estimate, not actual revenue.</p>
        <AdminClient />
      </main>
    </SiteShell>
  );
}
