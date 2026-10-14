"use client";
import { useState } from "react";

const specificProductImages = {
  "simple-face-wash": "/images/products/simple-face-wash.jpg",
  "lrp-effaclar-gel": "/images/products/lrp-effaclar-gel.jpg",
  "ponds-super-light-gel": "/images/products/ponds-super-light-gel.jpg",
  "cerave-moisturising-cream": "/images/products/cerave-moisturising-cream.jpg",
  "aqualogica-glow-sunscreen": "/images/products/aqualogica-glow-sunscreen.jpg",
  "lrp-anthelios-uvmue": "/images/products/lrp-anthelios-uvmue.jpg",
};

const categoryImages = {
  cleanser: "/images/products/cleanser.jpg",
  moisturizer: "/images/products/cream.jpg",
  cream: "/images/products/cream.jpg",
  sunscreen: "/images/products/sunscreen.jpg",
  serum: "/images/products/serum.jpg",
  acne: "/images/products/serum.jpg",
  eye: "/images/products/cream.jpg",
  lip: "/images/products/cream.jpg",
  body: "/images/products/cleanser.jpg",
};

export default function ProductVisual({ id = "", brand = "T", category = "", name = "" }) {
  const [imgError, setImgError] = useState(false);

  // Exact product image lookup by ID, then category fallback
  const directSrc = id ? specificProductImages[id] : null;
  const catKey = Object.keys(categoryImages).find((k) =>
    (category || "").toLowerCase().includes(k)
  );
  const imgSrc = directSrc || (catKey ? categoryImages[catKey] : "/images/products/serum.jpg");

  if (!imgError && imgSrc) {
    return (
      <div className="product-visual-wrapper">
        <img
          src={imgSrc}
          alt={`${brand} ${name || category}`}
          className="product-photo"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          loading="lazy"
        />
        <div className="product-photo-overlay" />
      </div>
    );
  }

  const initial = String(brand).charAt(0).toUpperCase();
  const kind = /lip/i.test(category)
    ? "tube"
    : /serum|acne/i.test(category)
    ? "dropper"
    : /cream|eye|moisturizer/i.test(category)
    ? "jar"
    : "bottle";
  const gid = `g-${String(id || name || brand + category).replace(/\W/g, "").slice(0, 28)}`;

  return (
    <svg className="visual" viewBox="0 0 240 220" role="img" aria-label={`${brand} ${category} illustration`}>
      <defs>
        <linearGradient id={gid} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#F3E9E6" />
          <stop offset="45%" stopColor="#D4A5A8" />
          <stop offset="100%" stopColor="#D9C1AC" />
        </linearGradient>
      </defs>
      <rect width="240" height="220" fill="#F3E9E6" />
      <circle cx="190" cy="40" r="48" fill="#D4A5A8" opacity="0.35" />
      <circle cx="30" cy="180" r="40" fill="#D9C1AC" opacity="0.4" />
      <ellipse cx="120" cy="182" rx="44" ry="7" fill="#6B3A3A" opacity="0.14" />
      {kind === "jar" && (
        <>
          <rect x="76" y="56" width="88" height="20" rx="4" fill="#6B3A3A" />
          <line x1="80" y1="66" x2="160" y2="66" stroke="#A87C7C" strokeWidth="1" opacity="0.6" />
          <rect x="70" y="76" width="100" height="92" rx="16" fill={`url(#${gid})`} stroke="#A87C7C" strokeWidth="1.2" />
          <rect x="86" y="98" width="68" height="50" rx="3" fill="#F3E9E6" fillOpacity="0.85" stroke="#D9C1AC" strokeWidth="0.8" />
        </>
      )}
      {kind === "tube" && (
        <>
          <rect x="108" y="42" width="24" height="16" rx="3" fill="#6B3A3A" />
          <path d="M92 58h56l10 110H82z" fill={`url(#${gid})`} stroke="#A87C7C" strokeWidth="1.2" />
          <rect x="98" y="86" width="44" height="60" rx="2" fill="#F3E9E6" fillOpacity="0.85" stroke="#D9C1AC" strokeWidth="0.8" />
        </>
      )}
      {kind === "dropper" && (
        <>
          <rect x="110" y="34" width="20" height="30" rx="8" fill="#6B3A3A" />
          <rect x="106" y="60" width="28" height="8" rx="2" fill="#A87C7C" />
          <rect x="96" y="68" width="48" height="104" rx="16" fill={`url(#${gid})`} stroke="#A87C7C" strokeWidth="1.2" />
          <rect x="102" y="92" width="36" height="56" rx="3" fill="#F3E9E6" fillOpacity="0.85" stroke="#D9C1AC" strokeWidth="0.8" />
        </>
      )}
      {kind === "bottle" && (
        <>
          <rect x="108" y="36" width="24" height="24" rx="4" fill="#6B3A3A" />
          <rect x="86" y="60" width="68" height="112" rx="20" fill={`url(#${gid})`} stroke="#A87C7C" strokeWidth="1.2" />
          <rect x="96" y="86" width="48" height="64" rx="3" fill="#F3E9E6" fillOpacity="0.85" stroke="#D9C1AC" strokeWidth="0.8" />
        </>
      )}
      <text x="120" y="124" textAnchor="middle" fontFamily="Georgia, serif" fontSize="26" fontWeight="500" fill="#6B3A3A">
        {initial}
      </text>
    </svg>
  );
}
