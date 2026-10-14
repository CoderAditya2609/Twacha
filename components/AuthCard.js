"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  auth,
  db,
  signInWithGoogle,
  handleFirestoreError,
  OperationType,
} from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";

function friendlyError(message) {
  const m = (message || "").toLowerCase();
  if (m.includes("popup-closed-by-user")) return "Sign-in was closed. Please try again when ready.";
  if (m.includes("invalid-credential") || m.includes("wrong-password") || m.includes("user-not-found"))
    return "Those credentials do not match our records. Please try again.";
  if (m.includes("email-already-in-use"))
    return "An account with this email already exists. Sign in with Google or your password.";
  if (m.includes("weak-password")) return "Password should be at least 6 characters.";
  return message || "Something went quietly wrong. Please try again.";
}

export default function AuthCard() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);

  async function syncUserAndRedirect(user) {
    try {
      // Save or update public user record in Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          id: user.uid,
          email: user.email || "",
          displayName: user.displayName || user.email?.split("@")[0] || "Guest",
          photoURL: user.photoURL || "",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Check if user has an existing skincare profile
      const profileSnap = await getDoc(doc(db, "profiles", user.uid));
      if (profileSnap.exists()) {
        location.href = "/chat";
      } else {
        location.href = "/onboarding";
      }
    } catch (err) {
      console.warn("User sync warning:", err);
      // Even if Firestore sync has permissions latency, navigate to chat
      location.href = "/chat";
    }
  }

  async function handleGoogleSignIn() {
    setNotice("");
    setFieldError("");
    setBusy(true);
    const { user, error } = await signInWithGoogle();
    if (error || !user) {
      setBusy(false);
      if (error && !error.includes("popup-closed")) {
        setNotice(friendlyError(error));
      }
      return;
    }
    await syncUserAndRedirect(user);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice("");
    setFieldError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setFieldError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      let userCredential;
      if (mode === "signup") {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      await syncUserAndRedirect(userCredential.user);
    } catch (err) {
      setBusy(false);
      setNotice(friendlyError(err.message));
    }
  }

  return (
    <section className="card auth-card">
      <div className="center" style={{ marginBottom: 24 }}>
        <div className="eyebrow">Personal Skincare Atelier</div>
        <h2>{mode === "signin" ? "Welcome Back" : "Begin Your Ritual"}</h2>
        <p className="muted">Secure authentication powered by Firebase. Your details are used strictly to personalize your skincare guidance.</p>
      </div>

      {/* Primary Google Sign-in */}
      <button
        type="button"
        className="google-btn"
        onClick={handleGoogleSignIn}
        disabled={busy}
        aria-label="Continue with Google"
      >
        <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{busy ? "Signing in securely…" : "Continue with Google"}</span>
      </button>

      <div className="auth-divider">
        <span>or sign in with email</span>
      </div>

      <div className="tabs">
        <button
          className={`tab ${mode === "signin" ? "active" : ""}`}
          onClick={() => {
            setMode("signin");
            setNotice("");
          }}
        >
          Sign in
        </button>
        <button
          className={`tab ${mode === "signup" ? "active" : ""}`}
          onClick={() => {
            setMode("signup");
            setNotice("");
          }}
        >
          Create account
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <form onSubmit={handleSubmit} noValidate>
            <Field
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              label="Password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {fieldError && <p className="error">{fieldError}</p>}
            {notice && <div className="notice">{notice}</div>}
            <Button type="submit" disabled={busy} style={{ width: "100%", marginTop: 8 }}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
