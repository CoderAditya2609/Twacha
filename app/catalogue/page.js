import SiteShell from "@/components/SiteShell";
import CatalogueView from "@/components/catalogue/CatalogueView";

export default function Catalogue() {
  return (
    <SiteShell>
      <main className="page">
        <CatalogueView />
      </main>
    </SiteShell>
  );
}
