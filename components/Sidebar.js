"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db, signOutUser } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { authenticatedFetch } from "@/lib/auth";

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser || null);
      setIsAdmin(false);
      setHistory([]);
      if (!currentUser) return;

      try {
        const res = await authenticatedFetch("/api/admin");
        if (res.ok) setIsAdmin(true);
      } catch {
        setIsAdmin(false);
      }
      try {
        const q = query(
          collection(db, "messages"),
          where("user_id", "==", currentUser.uid),
          limit(80)
        );
        const snap = await getDocs(q);
        const loaded = [];
        snap.forEach((d) => loaded.push({ id: d.id, ...d.data() }));
        loaded.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
        const asked = loaded
          .filter((m) => m.role === "user" && !String(m.content || "").startsWith("📷"))
          .slice(-14)
          .reverse();
        setHistory(asked);
      } catch {
        setHistory([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (mobileOpen) onCloseMobile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function handleSignOut() {
    await signOutUser();
    location.href = "/";
  }

  function handleNewChat() {
    if (pathname?.startsWith("/chat")) {
      window.dispatchEvent(new CustomEvent("twacha:new-chat"));
    } else {
      router.push("/chat?new=1");
    }
    onCloseMobile?.();
  }

  const initials = (user?.displayName || user?.email || "U").trim().charAt(0).toUpperCase();

  const itemClass = (active) => `side-link${active ? " active" : ""}`;

  return (
    <aside className={`sidebar${mobileOpen ? " open" : ""}`} aria-label="Primary navigation">
      <div className="side-head">
        <Link href={user ? "/chat" : "/"} className="wordmark" onClick={onCloseMobile}>
          Twacha
        </Link>
        {user && (
          <button
            className="side-close"
            type="button"
            aria-label="Close menu"
            onClick={onCloseMobile}
          >
            ×
          </button>
        )}
      </div>

      <nav className="side-nav">
        <Link href="/chat" className={itemClass(pathname?.startsWith("/chat"))} onClick={onCloseMobile}>
          <span className="side-ico" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </span>
          Chat with Claire
        </Link>

        <button
          type="button"
          className="side-link side-action"
          onClick={handleNewChat}
        >
          <span className="side-ico" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          New chat
        </button>

        {user && history.length > 0 && (
          <div className="side-history" aria-label="Chat history">
            <div className="side-label">Recent chats</div>
            {history.map((m) => (
              <Link
                key={m.id}
                href="/chat"
                className={`side-history-item${pathname?.startsWith("/chat") ? " active" : ""}`}
                onClick={onCloseMobile}
                title={m.content}
              >
                <span className="side-history-dot" aria-hidden />
                <span className="side-history-text">{m.content.slice(0, 34)}</span>
              </Link>
            ))}
          </div>
        )}

        <Link href="/catalogue" className={itemClass(pathname?.startsWith("/catalogue"))} onClick={onCloseMobile}>
          <span className="side-ico" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          Catalogue
        </Link>

        {user && (
          <Link href="/profile" className={itemClass(pathname?.startsWith("/profile"))} onClick={onCloseMobile}>
            <span className="side-ico" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            My profile
          </Link>
        )}

        {user && isAdmin && (
          <Link href="/admin" className={itemClass(pathname?.startsWith("/admin"))} onClick={onCloseMobile}>
            <span className="side-ico" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            Admin
          </Link>
        )}
      </nav>

      <div className="side-foot">
        {user ? (
          <>
            <div className="side-user">
              <span className="side-avatar" aria-hidden>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="side-avatar-img" />
                ) : (
                  initials
                )}
              </span>
              <span className="side-user-meta">
                <strong>{user.displayName?.split(" ")[0] || "Account"}</strong>
                <small>{user.email}</small>
              </span>
            </div>
            <button type="button" className="side-link side-action" onClick={handleSignOut}>
              <span className="side-ico" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
              </span>
              Logout
            </button>
          </>
  ) : null}
      </div>
    </aside>
  );
}
