"use client";
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("./DewdropScene"), {
  ssr: false,
  loading: () => <div className="orb-fallback" aria-hidden />,
});

export default function DewdropCanvas({ className = "hero-canvas" }) {
  return <Scene className={className} />;
}
