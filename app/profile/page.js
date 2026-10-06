import SiteShell from "@/components/SiteShell";
import ProfileForm from "@/components/ProfileForm";

export default function Profile() {
  return (
    <SiteShell>
      <main className="page form-wrap">
        <div className="eyebrow">Your personal profile</div>
        <h1>My profile</h1>
        <ProfileForm editing />
      </main>
    </SiteShell>
  );
}
