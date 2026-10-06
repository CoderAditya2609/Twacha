"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";

function friendlyError(message) {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "Those details don’t match our records. Please try again.";
  if (m.includes("already registered")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("password")) return "Please choose a password with at least 6 characters.";
  return message || "Something went quietly wrong. Please try again.";
}

export default function AuthCard() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setNotice("");
    setFieldError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setFieldError("Password should be at least 6 characters.");
      return;
    }
    setBusy(true);
    const s = getSupabaseBrowser();
    const result = mode === "signup" ? await s.auth.signUp({ email, password }) : await s.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) {
      setNotice(friendlyError(result.error.message));
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setNotice("Account created. Check your email to confirm it, then sign in.");
      return;
    }
    location.href = "/chat";
  }

  return (
    <section className="card auth-card">
      <div className="tabs">
        <button className={`tab ${mode === "signin" ? "active" : ""}`} onClick={() => setMode("signin")}>
          Sign in
        </button>
        <button className={`tab ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>
          Create account
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          <h2>{mode === "signin" ? "Welcome back" : "Begin quietly"}</h2>
          <p className="muted">Your details are used only to personalise your guidance.</p>
          <form onSubmit={submit} noValidate>
            <Field label="Email address" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field label="Password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            {fieldError && <p className="error">{fieldError}</p>}
            {notice && <div className="notice">{notice}</div>}
            <Button type="submit" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
