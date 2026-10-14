export function canUse3D() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.innerWidth < 500) return false;
  if ((navigator.hardwareConcurrency || 4) < 2) return false;
  return true;
}
