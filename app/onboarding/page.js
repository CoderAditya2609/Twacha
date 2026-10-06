import SiteShell from "@/components/SiteShell";
import ProfileForm from "@/components/ProfileForm";

export default function Onboarding() {
  return (
    <SiteShell>
      <main className="page form-wrap">
        <div className="eyebrow">Your personal profile</div>
        <h1>Let’s get to know your skin.</h1>
        <p className="muted">This takes about two minutes. You can change these details any time.</p>
        <ProfileForm />
      </main>
    </SiteShell>
  );
}
