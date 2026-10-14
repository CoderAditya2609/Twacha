"use client";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function TiltCard({ children, className = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  function move(e) {
    if (reduce || window.matchMedia("(pointer: coarse)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const rx = (0.5 - y) * 10;
    const ry = (x - 0.5) * 12;
    el.style.transition = "transform 0.1s ease-out";
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
  }
  function leave() {
    if (!ref.current) return;
    ref.current.style.transition = "transform 0.5s cubic-bezier(0.2, 0, 0.2, 1)";
    ref.current.style.transform = "perspective(800px) rotateX(0) rotateY(0) translateY(0)";
  }

  return (
    <motion.article
      ref={ref}
      className={`card tilt-card ${className}`.trim()}
      onMouseMove={move}
      onMouseLeave={leave}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {children}
      <span className="glare" aria-hidden />
    </motion.article>
  );
}
