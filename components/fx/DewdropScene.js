"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { canUse3D } from "@/lib/graphics";

function Scene() {
  const group = useRef();
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 0.4;
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 0.25;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.14;
    group.current.rotation.x += delta * 0.04;
    group.current.position.x += (pointer.current.x - group.current.position.x) * 0.05;
    group.current.position.y += (-pointer.current.y - group.current.position.y) * 0.05;
  });
  return (
    <>
      <ambientLight intensity={1.1} color="#F3E9E6" />
      <directionalLight position={[4, 6, 4]} intensity={1.4} color="#D9C1AC" />
      <pointLight position={[-4, -1, 3]} intensity={1.2} color="#D4A5A8" />
      <pointLight position={[2, -3, 2]} intensity={0.8} color="#A87C7C" />
      <group ref={group}>
        <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.7}>
          <mesh>
            <sphereGeometry args={[0.96, 64, 64]} />
            <MeshDistortMaterial
              color="#D4A5A8"
              roughness={0.1}
              metalness={0.06}
              clearcoat={1}
              clearcoatRoughness={0.06}
              distort={0.32}
              speed={1.5}
              transmission={0.45}
              thickness={1.3}
              ior={1.42}
            />
          </mesh>
        </Float>
        {[
          [-1.7, 0.8, 0.4, 0.22, "#D9C1AC"],
          [1.55, -0.4, 0.2, 0.16, "#A87C7C"],
          [0.9, 1.15, -0.3, 0.14, "#F3E9E6"],
          [-0.6, -1.1, 0.5, 0.15, "#D4A5A8"],
          [-1.2, -0.7, -0.3, 0.11, "#6B3A3A"],
          [1.3, 0.9, 0.3, 0.12, "#D9C1AC"],
        ].map(([x, y, z, r, c], i) => (
          <Float key={i} speed={1.3 + i * 0.2} floatIntensity={0.95}>
            <mesh position={[x, y, z]}>
              <sphereGeometry args={[r, 32, 32]} />
              <meshPhysicalMaterial
                color={c}
                roughness={0.16}
                metalness={0.08}
                clearcoat={0.9}
                clearcoatRoughness={0.1}
              />
            </mesh>
          </Float>
        ))}
      </group>
    </>
  );
}

export default function DewdropScene({ className = "" }) {
  const wrap = useRef(null);
  const [ok, setOk] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setOk(canUse3D());
    const node = wrap.current;
    if (!node) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.08 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  if (!ok) return <div className={`orb-fallback ${className}`.trim()} aria-hidden />;

  return (
    <div ref={wrap} className={className} aria-hidden>
      <Canvas
        dpr={[1, 2]}
        frameloop={visible ? "always" : "never"}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 5.2], fov: 38 }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
