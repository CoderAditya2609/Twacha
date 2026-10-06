"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import Atmosphere from "@/components/fx/Atmosphere";
import CursorGlow from "@/components/fx/CursorGlow";

export default function SiteShell({ children, flush = false }) {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  async function signOut() {
    await getSupabaseBrowser().auth.signOut();
    location.href = "/";
  }

  const links = user ? (
    <>
      <Link href="/chat">Atelier</Link>
      <Link href="/products">Catalogue</Link>
      <Link href="/profile">Profile</Link>
      <button className="btn ghost" onClick={signOut}>
        Sign out
      </button>
    </>
  ) : (
    <>
      <Link href="/#ritual">The ritual</Link>
      <Link href="/login">Sign in</Link>
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
        <button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
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
