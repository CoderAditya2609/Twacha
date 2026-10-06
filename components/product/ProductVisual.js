export default function ProductVisual({ brand = "T", category = "", name = "" }) {
  const initial = String(brand).charAt(0).toUpperCase();
  const kind = /lip/i.test(category) ? "tube" : /serum|acne/i.test(category) ? "dropper" : /cream|eye|moisturizer/i.test(category) ? "jar" : "bottle";
  const gid = `g-${String(name || brand + category).replace(/\W/g, "").slice(0, 28)}`;
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
      {kind === "jar" && (
        <>
          <rect x="78" y="58" width="84" height="18" rx="4" fill="#6B3A3A" />
          <rect x="70" y="76" width="100" height="92" rx="18" fill={`url(#${gid})`} stroke="#A87C7C" />
        </>
      )}
      {kind === "tube" && (
        <>
          <rect x="108" y="42" width="24" height="16" rx="3" fill="#6B3A3A" />
          <path d="M92 58h56l10 110H82z" fill={`url(#${gid})`} stroke="#A87C7C" />
        </>
      )}
      {kind === "dropper" && (
        <>
          <rect x="110" y="36" width="20" height="28" rx="8" fill="#6B3A3A" />
          <rect x="96" y="64" width="48" height="108" rx="16" fill={`url(#${gid})`} stroke="#A87C7C" />
        </>
      )}
      {kind === "bottle" && (
        <>
          <rect x="108" y="38" width="24" height="22" rx="4" fill="#6B3A3A" />
          <rect x="86" y="60" width="68" height="112" rx="22" fill={`url(#${gid})`} stroke="#A87C7C" />
        </>
      )}
      <text x="120" y="128" textAnchor="middle" fontFamily="Georgia, serif" fontSize="34" fill="#6B3A3A">
        {initial}
      </text>
    </svg>
  );
}
