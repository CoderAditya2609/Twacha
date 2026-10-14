"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { auth, db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Field from "@/components/ui/Field";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const concerns = ["dark spots", "pigmentation", "dullness", "dark circles", "large pores", "wrinkles", "redness", "oiliness", "dryness", "dandruff"];
const blank = {
  age: "",
  gender: "",
  height_cm: "",
  weight_kg: "",
  activity_level: "moderate",
  sleep_hours: "7",
  water_intake: "6 glasses",
  diet_type: "",
  stress_level: "moderate",
  skin_type: "",
  acne_level: "none",
  acne_type: "",
  main_concerns: [],
  allergies: "",
  current_routine: "",
  climate: "humid",
  budget: "medium",
  preference: "both",
  pregnancy_or_medication: "no",
};

const skinTypes = [
  ["oily", "◐", "Oily"],
  ["dry", "○", "Dry"],
  ["combination", "◑", "Combination"],
  ["normal", "●", "Normal"],
  ["sensitive", "◇", "Sensitive"],
];
const budgets = [
  ["low", "₹", "Considered"],
  ["medium", "₹₹", "Balanced"],
  ["high", "₹₹₹", "Premium"],
];

function waterNumber(value) {
  const n = parseInt(String(value || "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 6;
}

export default function ProfileForm({ editing = false }) {
  const [form, setForm] = useState(blank);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        location.href = "/login";
        return;
      }
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        if (snap.exists()) {
          setForm({ ...blank, ...snap.data() });
        }
      } catch (err) {
        console.warn("Could not load profile:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  async function save() {
    setMessage("");
    const user = auth.currentUser;
    if (!user) {
      location.href = "/login";
      return;
    }
    const payload = {
      ...form,
      id: user.uid,
      age: Number(form.age) || null,
      height_cm: Number(form.height_cm) || null,
      weight_kg: Number(form.weight_kg) || null,
      sleep_hours: Number(form.sleep_hours) || null,
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, "profiles", user.uid), payload, { merge: true });
      setDone(true);
      setTimeout(() => {
        location.href = "/chat";
      }, 1600);
    } catch (error) {
      console.error("Save profile error:", error);
      setMessage(error.message || "Failed to save profile. Please try again.");
      handleFirestoreError(error, OperationType.WRITE, `profiles/${user.uid}`);
    }
  }

  if (loading) return <Card>Loading your profile…</Card>;
  const toggle = (x) => set("main_concerns", form.main_concerns.includes(x) ? form.main_concerns.filter((i) => i !== x) : [...form.main_concerns, x]);
  const glasses = waterNumber(form.water_intake);

  if (done) {
    return (
      <Card className="done-burst">
        <motion.div className="ring" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          ✦
        </motion.div>
        <h2>Your profile is ready</h2>
        <p className="muted">Taking you to a quieter conversation.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="progress-meta">
        <span>Step {step} of 4</span>
        <span>{["Lifestyle", "Skin", "Ritual", "Safety"][step - 1]}</span>
      </div>
      <div className="progress">
        <div style={{ width: `${(step / 4) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
          {step === 1 && (
            <div className="form-grid">
              <Field label="Age" type="number" min="13" value={form.age} onChange={(e) => set("age", e.target.value)} />
              <Field label="Gender (optional)" value={form.gender || ""} onChange={(e) => set("gender", e.target.value)} />
              <Field label="Height (cm)" type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} />
              <Field label="Weight (kg)" type="number" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
              <div className="field span2">
                <p className="eyebrow">Activity</p>
                <div className="choice-grid">
                  {["low", "moderate", "high"].map((x) => (
                    <button key={x} type="button" className={`choice ${form.activity_level === x ? "on" : ""}`} onClick={() => set("activity_level", x)}>
                      {x}
                    </button>
                  ))}
                </div>
              </div>
              <div className="span2">
                <p className="eyebrow">Sleep each night · {form.sleep_hours || 7} hours</p>
                <input className="range" type="range" min="4" max="12" step="0.5" value={form.sleep_hours || 7} onChange={(e) => set("sleep_hours", e.target.value)} aria-label="Sleep hours" />
                <div className="range-row">
                  <span>4h</span>
                  <span>12h</span>
                </div>
              </div>
              <div className="span2">
                <p className="eyebrow">Water · {glasses} glasses</p>
                <input
                  className="range"
                  type="range"
                  min="2"
                  max="14"
                  value={glasses}
                  onChange={(e) => set("water_intake", `${e.target.value} glasses`)}
                  aria-label="Water intake"
                />
              </div>
              <Field label="Diet type" placeholder="e.g. vegetarian" value={form.diet_type || ""} onChange={(e) => set("diet_type", e.target.value)} />
              <div className="span2">
                <p className="eyebrow">Stress</p>
                <div className="choice-grid">
                  {["low", "moderate", "high"].map((x) => (
                    <button key={x} type="button" className={`choice ${form.stress_level === x ? "on" : ""}`} onClick={() => set("stress_level", x)}>
                      {x}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <p className="eyebrow">Skin type</p>
              <div className="choice-grid">
                {skinTypes.map(([id, ico, label]) => (
                  <button key={id} type="button" className={`choice ${form.skin_type === id ? "on" : ""}`} onClick={() => set("skin_type", id)}>
                    <span className="ico">{ico}</span>
                    {label}
                  </button>
                ))}
              </div>
              <div className="form-grid" style={{ marginTop: 18 }}>
                <Field label="Acne level" as="select" value={form.acne_level} onChange={(e) => set("acne_level", e.target.value)}>
                  {["none", "mild", "moderate", "severe"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </Field>
                <Field label="Acne type, if known" placeholder="e.g. whiteheads" value={form.acne_type || ""} onChange={(e) => set("acne_type", e.target.value)} />
              </div>
              <p className="eyebrow">Main concerns</p>
              <div className="checks">
                {concerns.map((x) => (
                  <Chip key={x} on={form.main_concerns.includes(x)} onClick={() => toggle(x)}>
                    {x}
                  </Chip>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <Field as="textarea" label="Known allergies or irritating ingredients" value={form.allergies || ""} onChange={(e) => set("allergies", e.target.value)} />
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <Field as="textarea" label="Current products / routine" placeholder="What do you use now, and how often?" value={form.current_routine || ""} onChange={(e) => set("current_routine", e.target.value)} />
              <p className="eyebrow">Climate</p>
              <div className="choice-grid">
                {["humid", "dry", "cold", "polluted"].map((x) => (
                  <button key={x} type="button" className={`choice ${form.climate === x ? "on" : ""}`} onClick={() => set("climate", x)}>
                    {x}
                  </button>
                ))}
              </div>
              <p className="eyebrow" style={{ marginTop: 18 }}>
                Monthly budget
              </p>
              <div className="choice-grid">
                {budgets.map(([id, ico, label]) => (
                  <button key={id} type="button" className={`choice ${form.budget === id ? "on" : ""}`} onClick={() => set("budget", id)}>
                    <span className="ico">{ico}</span>
                    {label}
                  </button>
                ))}
              </div>
              <p className="eyebrow" style={{ marginTop: 18 }}>
                You prefer
              </p>
              <div className="choice-grid">
                {["home remedies", "products", "both"].map((x) => (
                  <button key={x} type="button" className={`choice ${form.preference === x ? "on" : ""}`} onClick={() => set("preference", x)}>
                    {x}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <h2>A quiet safety check</h2>
              <p className="eyebrow">Pregnancy or prescription medication that affects skin?</p>
              <div className="choice-grid">
                {[
                  ["no", "No"],
                  ["yes", "Yes"],
                ].map(([id, label]) => (
                  <button key={id} type="button" className={`choice ${form.pregnancy_or_medication === id ? "on" : ""}`} onClick={() => set("pregnancy_or_medication", id)}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="notice">If you answer yes, Twacha will avoid recommending active treatments and guide you to a dermatologist when appropriate.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {message && <p className="error">{message}</p>}
      <div className="form-actions">
        <Button variant="ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)}>Continue</Button>
        ) : (
          <Button onClick={save}>Save profile</Button>
        )}
      </div>
    </Card>
  );
}
