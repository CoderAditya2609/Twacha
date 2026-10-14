import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export default function NotFound() {
  return (
    <SiteShell>
      <main className="page center" style={{ padding: "80px 20px" }}>
        <div className="eyebrow">404 · Page Not Found</div>
        <h1 style={{ fontSize: "3rem", margin: "16px 0" }}>A quiet misdirection</h1>
        <p className="muted" style={{ maxWidth: 460, margin: "0 auto 28px" }}>
          The path you seek does not exist in the atelier. Return to guidance or explore the catalogue.
        </p>
        <Link href="/" className="btn">
          Return to Atelier
        </Link>
      </main>
    </SiteShell>
  );
}
