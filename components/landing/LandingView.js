"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import DewdropCanvas from "@/components/fx/DewdropCanvas";
import Section from "@/components/ui/Section";
import TiltCard from "@/components/ui/TiltCard";

const headline = ["Care", "that", "feels", "like", "you."];

export default function LandingView() {
  const reduce = useReducedMotion();
  const heroRef = useRef(null);
  const cardRef = useRef(null);

  function handleHeroMove(e) {
    if (reduce || window.matchMedia("(pointer: coarse)").matches) return;
    const el = cardRef.current;
    const hero = heroRef.current;
    if (!el || !hero) return;
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateZ(10px)`;
  }

  function handleHeroLeave() {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  }

  return (
    <>
      <section
        className="hero-3d"
        ref={heroRef}
        onMouseMove={handleHeroMove}
        onMouseLeave={handleHeroLeave}
      >
        <DewdropCanvas />
        <div className="hero-copy" ref={cardRef} style={{ transition: "transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)" }}>
          <div className="eyebrow">Personal care, thoughtfully guided</div>
          <h1>
            {headline.map((word, i) => (
              <span className="word-mask" key={word}>
                <motion.span
                  initial={reduce ? false : { y: "115%", opacity: 0, rotateX: 20 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }}>
            Claire, Twacha&rsquo;s skincare assistant, uses your routine, skin needs, lifestyle and budget to help you make calmer, more informed choices.
          </motion.p>
          <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.6 }}>
            <Link className="btn" href="/chat">
              Enter the atelier
            </Link>
          </motion.div>
        </div>
      </section>

      <Section eyebrow="How it works" title="A quieter way to choose.">
        <div className="feature-grid" id="ritual">
          {[
            ["01", "Tell us your skin", "A few considered questions on type, climate, sleep and what you already use."],
            ["02", "Receive guidance", "Calm, structured advice — home options, product options, and who should skip an active."],
            ["03", "Shop with care", "Only a curated catalogue, with honest notes and affiliate links clearly marked."],
          ].map(([n, t, d]) => (
            <TiltCard key={n}>
              <div className="step-index">{n}</div>
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </TiltCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Personalised routine" title="Built around your life, not a trend.">
        <div className="feature-grid">
          {[
            ["Skin, honestly", "Oily, dry, combination or sensitive — we stay with what you actually live with."],
            ["Budget, respected", "A considered option and a quieter alternative, always from this catalogue."],
            ["Climate, included", "Humidity, dust and heat change a routine. We remember yours."],
          ].map(([t, d]) => (
            <TiltCard key={t}>
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </TiltCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Safe & honest advice" title="No theatre. No miracle claims.">
        <div className="feature-grid">
          {[
            ["Not a diagnosis", "We explain possibilities, name uncertainty, and point to a dermatologist when needed."],
            ["Ingredients, plainly", "What an active does, who should avoid it, and which pairings are unwise."],
            ["Affiliate, disclosed", "If you buy through a link, a commission may follow — never at extra cost to you."],
          ].map(([t, d]) => (
            <TiltCard key={t}>
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </TiltCard>
          ))}
        </div>
      </Section>
    </>
  );
}
