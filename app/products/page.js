import SiteShell from "@/components/SiteShell";
import ProductsView from "@/components/products/ProductsView";

export default function Products() {
  return (
    <SiteShell>
      <main className="page">
        <ProductsView />
      </main>
    </SiteShell>
  );
}
