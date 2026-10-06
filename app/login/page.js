import SiteShell from "@/components/SiteShell";
import AuthCard from "@/components/AuthCard";
import DewdropCanvas from "@/components/fx/DewdropCanvas";

export default function Login() {
  return (
    <SiteShell flush>
      <main className="auth-split">
        <div className="auth-visual">
          <DewdropCanvas className="hero-canvas" />
        </div>
        <div className="auth-panel">
          <AuthCard />
        </div>
      </main>
    </SiteShell>
  );
}
