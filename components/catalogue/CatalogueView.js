"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import products from "@/data/products.json";
import ProductVisual from "@/components/product/ProductVisual";

const SKIN_TYPES = ["All", "oily", "dry", "combination", "normal", "sensitive"];

const BUDGETS = [
  { key: "All", label: "All budgets", min: 0, max: Infinity },
  { key: "low", label: "Under ₹500", min: 0, max: 499 },
  { key: "medium", label: "₹500 – ₹1500", min: 500, max: 1500 },
  { key: "high", label: "₹1500+", min: 1501, max: Infinity },
];

export default function CatalogueView() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    []
  );

  const [cat, setCat] = useState("All");
  const [skin, setSkin] = useState("All");
  const [budget, setBudget] = useState("All");
  const [search, setSearch] = useState("");

  const list = useMemo(() => {
    const b = BUDGETS.find((x) => x.key === budget) || BUDGETS[0];
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "All" && p.category !== cat) return false;
      if (skin !== "All" && !(p.suitable_skin_types || []).some((s) => s === skin)) return false;
      if (p.price_inr < b.min || p.price_inr > b.max) return false;
      if (q) {
        const hay = [
          p.name,
          p.brand,
          p.category,
          ...(p.key_ingredients || []),
          ...(p.suitable_skin_types || []),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cat, skin, budget, search]);

  const askClaire = (p) => {
    const question = `What should I know about ${p.name} by ${p.brand} — is ${p.category.toLowerCase()} like this a good fit for my skin, and how should I use it?`;
    router.push(`/chat?ask=${encodeURIComponent(question)}`);
  };

  return (
    <>
      <div className="eyebrow">Catalogue</div>
      <h1>The Twacha Catalogue</h1>
      <p className="muted">
        Every formulation Claire recommends, explained simply. Filter by concern, skin type and
        budget, or ask Claire directly about any product.
      </p>

      <div className="catalogue-filters" role="search" aria-label="Catalogue filters">
        <div className="filter-group">
          <span className="filter-label">Search</span>
          <input
            type="search"
            className="filter-search"
            placeholder="Search products, brands, ingredients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Category</span>
          <div className="filters chips" role="group" aria-label="Categories">
            {categories.map((c) => (
              <button
                key={c}
                className={`chip${cat === c ? " on" : ""}`}
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Skin type</span>
          <div className="filters chips" role="group" aria-label="Skin types">
            {SKIN_TYPES.map((s) => (
              <button
                key={s}
                className={`chip${skin === s ? " on" : ""}`}
                aria-pressed={skin === s}
                onClick={() => setSkin(s)}
              >
                {s === "All" ? "All skin" : s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Budget</span>
          <div className="filters chips" role="group" aria-label="Budget">
            {BUDGETS.map((b) => (
              <button
                key={b.key}
                className={`chip${budget === b.key ? " on" : ""}`}
                aria-pressed={budget === b.key}
                onClick={() => setBudget(b.key)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="muted catalogue-count" aria-live="polite">
        {list.length} {list.length === 1 ? "product" : "products"}
      </p>

      {list.length === 0 ? (
        <p className="notice">No products match these filters yet. Try widening your search.</p>
      ) : (
        <section className="products">
          {list.map((p, i) => (
            <motion.div
              key={p.id}
              className="product-cell"
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
            >
              <article className="card product-card">
                <div className="product-media">
                  <ProductVisual
                    id={p.id}
                    brand={p.brand}
                    category={p.category}
                    name={p.name}
                    imageUrl={p.image_url}
                  />
                  <span className="tag">{p.category}</span>
                </div>
                <div className="product-body">
                  <h2>{p.name}</h2>
                  <p className="muted product-brand">{p.brand}</p>
                  <div className="price">₹{p.price_inr}</div>
                  <div className="ing">
                    {p.key_ingredients.map((ing) => (
                      <span key={ing}>{ing}</span>
                    ))}
                  </div>
                  <p className="muted product-suit">
                    <b>Suitable for:</b> {p.suitable_skin_types.join(", ")}
                  </p>
                  {p.avoid_if?.length ? (
                    <p className="muted product-avoid">
                      <b>Avoid if:</b> {p.avoid_if.join(", ")}
                    </p>
                  ) : null}
                  <div className="product-actions">
                    <a className="btn" href={`/go/${p.id}`}>
                      Buy
                    </a>
                    <button type="button" className="btn ghost" onClick={() => askClaire(p)}>
                      Ask Claire about this
                    </button>
                  </div>
                </div>
              </article>
            </motion.div>
          ))}
        </section>
      )}
    </>
  );
}
