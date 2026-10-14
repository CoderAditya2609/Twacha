import SiteShell from "@/components/SiteShell";
import AuthCard from "@/components/AuthCard";
import DewdropCanvas from "@/components/fx/DewdropCanvas";

export default function Login() {
  return (
    <SiteShell flush>
      <main className="auth-split">
        <div className="auth-visual">
          <DewdropCanvas className="hero-canvas" />
          <div className="auth-visual-copy">
            <div className="eyebrow">Personalized Skincare Atelier</div>
            <blockquote className="auth-quote">
              “Bespoke formulations, honest actives, and mindful care tailored to your skin’s unique nature.”
            </blockquote>
            <span className="auth-sig">— Twacha Atelier</span>
          </div>
        </div>
        <div className="auth-panel">
          <AuthCard />
        </div>
      </main>
    </SiteShell>
  );
}
