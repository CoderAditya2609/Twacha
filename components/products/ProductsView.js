"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import products from "@/data/products.json";
import ProductVisual from "@/components/product/ProductVisual";
import TiltCard from "@/components/ui/TiltCard";

export default function ProductsView() {
  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category)))], []);
  const [cat, setCat] = useState("All");
  const list = cat === "All" ? products : products.filter((p) => p.category === cat);

  return (
    <>
      <div className="eyebrow">Curated catalogue</div>
      <h1>Products, simply explained.</h1>
      <p className="muted">These product links are included for the assignment demonstration. Choose what suits your skin and budget.</p>
      <div className="filters" role="tablist" aria-label="Categories">
        {categories.map((c) => (
          <button key={c} className={`filter-pill ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <section className="products">
        {list.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <TiltCard className="product-card">
              <ProductVisual brand={p.brand} category={p.category} name={p.name} />
              <span className="tag">{p.category}</span>
              <div>
                <h2>{p.name}</h2>
                <p className="muted">{p.brand}</p>
              </div>
              <div className="price">₹{p.price_inr}</div>
              <div className="ing">
                {p.key_ingredients.map((ing) => (
                  <span key={ing}>{ing}</span>
                ))}
              </div>
              <p className="muted">
                <b>Suitable for:</b> {p.suitable_skin_types.join(", ")}
              </p>
              {p.avoid_if?.length ? (
                <p className="muted">
                  <b>Avoid if:</b> {p.avoid_if.join(", ")}
                </p>
              ) : null}
              <a className="btn" href={`/go/${p.id}`}>
                Buy
              </a>
            </TiltCard>
          </motion.div>
        ))}
      </section>
    </>
  );
}
