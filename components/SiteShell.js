"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { auth, signOutUser, testConnection } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Atmosphere from "@/components/fx/Atmosphere";
import CursorGlow from "@/components/fx/CursorGlow";

export default function SiteShell({ children, flush = false }) {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  async function handleSignOut() {
    await signOutUser();
    location.href = "/";
  }

  const links = user ? (
    <>
      <Link href="/chat">Atelier</Link>
      <Link href="/products">Catalogue</Link>
      <Link href="/profile">Profile</Link>
      <div className="user-nav-chip" title={user.email || ""}>
        {user.photoURL ? (
          <img src={user.photoURL} alt="Avatar" className="user-avatar-mini" />
        ) : (
          <span className="user-initial">
            {(user.displayName || user.email || "U")[0].toUpperCase()}
          </span>
        )}
        <span className="user-name-snippet">
          {user.displayName?.split(" ")[0] || "Account"}
        </span>
      </div>
      <button className="btn ghost" onClick={handleSignOut} style={{ padding: "8px 16px" }}>
        Sign out
      </button>
    </>
  ) : (
    <>
      <Link href="/#ritual">The ritual</Link>
      <Link href="/products">Catalogue</Link>
      <Link href="/login" className="btn" style={{ padding: "8px 20px" }}>
        Sign in
      </Link>
    </>
  );

  return (
    <div className="shell">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <Atmosphere />
      <CursorGlow />
      <header className="topbar">
        <Link href={user ? "/chat" : "/"} className="wordmark">
          Twacha
        </Link>
        <nav className="nav" aria-label="Primary">
          {links}
        </nav>
        <button
          className="menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
        </button>
      </header>
      <div className={`mobile-drawer ${open ? "open" : ""}`} hidden={!open}>
        {links}
      </div>
      <div id="content" className={flush ? "page flush" : undefined}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
      <footer className="footer">
        Contains affiliate links. We may earn a commission at no extra cost to you.
        <br />
        Not medical advice. Consult a dermatologist for severe or persistent skin problems.
      </footer>
    </div>
  );
}
