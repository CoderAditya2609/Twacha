"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import DewdropCanvas from "@/components/fx/DewdropCanvas";
import Section from "@/components/ui/Section";
import TiltCard from "@/components/ui/TiltCard";

const headline = ["Care", "that", "feels", "like", "you."];

export default function LandingView({ signedIn = false }) {
  const reduce = useReducedMotion();
  return (
    <>
      <section className="hero-3d">
        <DewdropCanvas />
        <div className="hero-copy">
          <div className="eyebrow">Personal care, thoughtfully guided</div>
          <h1>
            {headline.map((word, i) => (
              <span className="word-mask" key={word}>
                <motion.span
                  initial={reduce ? false : { y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
            Twacha’s skincare assistant uses your routine, skin needs, lifestyle and budget to help you make calmer, more informed choices.
          </motion.p>
          <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Link className="btn" href={signedIn ? "/chat" : "/login"}>
              {signedIn ? "Continue your ritual" : "Enter the atelier"}
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
