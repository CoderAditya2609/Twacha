"use client";
import { motion, useReducedMotion } from "framer-motion";

export default function Section({ eyebrow, title, children, className = "" }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      className={`section ${className}`.trim()}
      initial={reduce ? false : { opacity: 0, y: 36 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="section-inner">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </motion.section>
  );
}
