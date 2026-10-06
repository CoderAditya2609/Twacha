"use client";
import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const on = () => el.classList.add("on");
    const off = () => el.classList.remove("on");
    const move = (e) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseenter", on);
    document.addEventListener("mouseleave", off);
    on();
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseenter", on);
      document.removeEventListener("mouseleave", off);
    };
  }, []);
  return <div ref={ref} className="cursor-glow" aria-hidden />;
}
