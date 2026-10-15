"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Atmosphere from "@/components/fx/Atmosphere";
import CursorGlow from "@/components/fx/CursorGlow";
import Sidebar from "@/components/Sidebar";

export default function SiteShell({ children, flush = false }) {
  const [user, setUser] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e) => {
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const isChat = pathname?.startsWith("/chat");

  return (
    <div className={`shell shell-side${isChat ? " shell-chat" : ""}`}>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <Atmosphere />
      <CursorGlow />

      <div className="sidebar-area">
        <Sidebar mobileOpen={drawer} onCloseMobile={() => setDrawer(false)} />
      </div>

      {/* Dimmed backdrop for the mobile drawer */}
      <div
        className={`drawer-backdrop ${drawer ? "open" : ""}`}
        hidden={!drawer}
        onClick={() => setDrawer(false)}
        aria-hidden
      />

      <div className="main-area">
        <header className="topbar">
          <button
            className="menu-toggle"
            aria-label={drawer ? "Close menu" : "Open menu"}
            aria-expanded={drawer}
            onClick={() => setDrawer((v) => !v)}
          >
            <span />
          </button>
          <Link href={user ? "/chat" : "/"} className="topbar-wordmark">
            Twacha
          </Link>
          {!user && (
            <Link href="/login" className="btn topbar-signin">
              Sign in
            </Link>
          )}
        </header>

        <div id="content" className={flush ? "page flush" : "page"}>
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
    </div>
  );
}
