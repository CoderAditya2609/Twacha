import products from "@/data/products.json";
import ProductVisual from "./ProductVisual";

export default function ProductChip({ href, children }) {
  const id = String(href || "").replace(/^\/go\//, "").split(/[?#]/)[0];
  const product = products.find((p) => p.id === id);
  return (
    <a className="product-chip" href={href}>
      {product ? (
        <>
          <span className="mini">
            <ProductVisual brand={product.brand} category={product.category} name={product.name} />
          </span>
          <span>{product.name}</span>
          <span className="price">₹{product.price_inr}</span>
        </>
      ) : (
        <span>{children}</span>
      )}
    </a>
  );
}
