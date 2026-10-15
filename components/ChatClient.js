"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  limit,
} from "firebase/firestore";
import ProductChip from "@/components/product/ProductChip";
import Button from "@/components/ui/Button";
import { getAccessToken } from "@/lib/auth";

const starters = [
  "I have acne on my cheeks, what routine should I start?",
  "How can I reduce dullness and restore my skin barrier?",
  "Recommend a gentle daily routine suited for my budget.",
  "Which active ingredient works best for dark spots?",
];

function ClaireAvatar() {
  return (
    <span className="claire-avatar" aria-hidden>
      <svg viewBox="0 0 40 40" width="40" height="40">
        <defs>
          <linearGradient id="claire-avatar-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D4A5A8" />
            <stop offset="100%" stopColor="#6B3A3A" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="20" fill="url(#claire-avatar-grad)" />
        <text x="20" y="27" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fontWeight="600" fill="#F3E9E6">
          C
        </text>
      </svg>
    </span>
  );
}

function formatConfidence(conf) {
  if (typeof conf !== "number") return "Medium";
  if (conf >= 0.75) return "High";
  if (conf >= 0.45) return "Medium";
  return "Low";
}

function resizeAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No photo selected."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image format."));
      img.onload = () => {
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const base64 = dataUrl.split(",")[1];
        resolve({ dataUrl, base64, mimeType: "image/jpeg", originalName: file.name });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function AnalysisCard({ analysis, safetyMode }) {
  if (!analysis) return null;
  const skinType = analysis.skin_type_guess?.value || "unclear";
  const skinConfidence = formatConfidence(analysis.skin_type_guess?.confidence);
  const skinReason = analysis.skin_type_guess?.reason;
  const acneLevel = analysis.acne?.level || "none";
  const acneConfidence = formatConfidence(analysis.acne?.confidence);
  const concerns = Array.isArray(analysis.other_concerns) ? analysis.other_concerns : [];
  const limitations = analysis.limitations;
  const issues = analysis.photo_quality?.issues || [];

  return (
    <div className="analysis-card" aria-label="Visual skin observation card">
      <div className="analysis-header">
        <span className="eyebrow" style={{ color: "var(--mauve)", margin: 0 }}>
          Visual Skin Observation
        </span>
        <span className="analysis-badge">AI Vision Analysis</span>
      </div>

      {issues.length > 0 && !analysis.photo_quality?.usable && (
        <div className="safety-alert" style={{ marginBottom: 12 }}>
          <span>
            <strong>Photo Quality Notice:</strong> Image cannot be judged reliably due to:{" "}
            {issues.join(", ")}. Please try again with bare skin in diffuse daylight.
          </span>
        </div>
      )}

      <div className="analysis-metrics-grid">
        <div className="metric-box">
          <div className="metric-label">Observed Skin Type</div>
          <div className="metric-val">{skinType.toUpperCase()}</div>
          <div className="metric-sub">
            Confidence: <strong>{skinConfidence}</strong>
            {skinReason ? ` • ${skinReason}` : ""}
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-label">Acne & Congestion</div>
          <div className="metric-val">{acneLevel.toUpperCase()}</div>
          <div className="metric-sub">
            Confidence: <strong>{acneConfidence}</strong>
          </div>
        </div>
      </div>

      {concerns.length > 0 && (
        <div>
          <div className="metric-label" style={{ marginBottom: 4 }}>
            Identified Concerns
          </div>
          <div className="concerns-chips">
            {concerns.map((c, i) => {
              const name = typeof c === "string" ? c : c.name || "Concern";
              const severity = c?.severity ? ` (${c.severity})` : "";
              return (
                <span key={i} className="rose-chip">
                  {name}
                  {severity}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {safetyMode && (
        <div className="safety-alert">
          <span>✦</span>
          <span>
            <strong>Safety Observation:</strong> Visual signs indicate elevated congestion, deep cysts,
            or barrier sensitivity. Medical consultation with a certified dermatologist is strongly
            recommended.
          </span>
        </div>
      )}

      {limitations && (
        <div className="analysis-limitations">
          <strong>Limitations:</strong> {limitations}
        </div>
      )}
    </div>
  );
}

function Markdown({ children }) {
  return (
    <ReactMarkdown
      components={{
        a: ({ href, children: label }) =>
          href?.startsWith("/go/") ? (
            <ProductChip href={href}>{label}</ProductChip>
          ) : (
            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {label}
            </a>
          ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

export default function ChatClient() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [modelChoice, setModelChoice] = useState("general");

  // Photo analysis states
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);

  const end = useRef();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        location.href = "/login";
        return;
      }
      setUser(currentUser);

      try {
        // Prefill the composer when arriving from "Ask Claire about this"
        const ask = searchParams.get("ask");
        if (ask) setInput(ask);

        // Load user skincare profile
        const profSnap = await getDoc(doc(db, "profiles", currentUser.uid));
        if (!profSnap.exists()) {
          location.href = "/onboarding";
          return;
        }
        setProfile(profSnap.data());

        // "New chat" starts empty instead of restoring history
        if (searchParams.get("new") === "1") {
          setLoading(false);
          return;
        }

        // Load chat history from Firestore
        const q = query(
          collection(db, "messages"),
          where("user_id", "==", currentUser.uid),
          limit(60)
        );
        const querySnapshot = await getDocs(q);
        const loaded = [];
        querySnapshot.forEach((d) => {
          loaded.push({ id: d.id, ...d.data() });
        });
        loaded.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
        setMessages(loaded);
        setHistory(loaded);
      } catch (err) {
        console.warn("Could not load initial chat data:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [searchParams]);

  useEffect(() => {
    const onNewChat = () => startNewChat();
    window.addEventListener("twacha:new-chat", onNewChat);
    return () => window.removeEventListener("twacha:new-chat", onNewChat);
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming, analyzingPhoto]);

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    setError("");

    try {
      const resized = await resizeAndCompressImage(file);
      setPendingPhoto(resized);
    } catch (err) {
      setPhotoError(err.message || "Failed to process photo.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function runPhotoAnalysis() {
    if (!pendingPhoto || analyzingPhoto || streaming || !user) return;
    setAnalyzingPhoto(true);
    setStreaming(true);
    setPhotoError("");
    setError("");

    const optimisticUser = {
      id: `u-${Date.now()}`,
      user_id: user.uid,
      role: "user",
      content: "📷 [Skin Photo Submitted for AI Visual Observation]",
      createdAt: new Date().toISOString(),
    };

    const assistantMsgId = `a-${Date.now()}`;
    const optimisticAssistant = {
      id: assistantMsgId,
      user_id: user.uid,
      role: "assistant",
      content: "",
      analysis: null,
      safetyMode: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((m) => [...m, optimisticUser, optimisticAssistant]);
    setHistory((h) => [...h, optimisticUser]);

    // Persist a text-only placeholder so the photo turn survives a reload (image is never stored)
    try {
      await addDoc(collection(db, "messages"), {
        user_id: user.uid,
        role: "user",
        content: optimisticUser.content,
        createdAt: optimisticUser.createdAt,
      });
    } catch (dbErr) {
      console.warn("Firestore photo message write notice:", dbErr);
    }

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          imageBase64: pendingPhoto.base64,
          mimeType: pendingPhoto.mimeType,
          profile,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || "The skin photo analysis could not be completed. Please try again."
        );
      }

      // Check if response is JSON (e.g. unusable photo) or SSE stream
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        const contentText =
          data.message || data.recommendation || "Observation complete.";
        setMessages((m) =>
          m.map((x) =>
            x.id === assistantMsgId
              ? {
                  ...x,
                  analysis: data.analysis,
                  safetyMode: data.safetyMode,
                  content: contentText,
                }
              : x
          )
        );

        // Save to Firestore (short text summary, no image)
        const summaryText = `[Photo Skin Analysis] ${
          data.analysis?.skin_type_guess?.value || "unclear"
        } skin, acne: ${data.analysis?.acne?.level || "none"}.\n\n${contentText}`;
        try {
          await addDoc(collection(db, "messages"), {
            user_id: user.uid,
            role: "assistant",
            content: summaryText,
            createdAt: optimisticAssistant.createdAt,
          });
        } catch (dbErr) {
          console.warn("Firestore save notice:", dbErr);
        }
        return;
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedText = "";
      let capturedAnalysis = null;
      let capturedSafetyMode = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed) continue;

          let eventType = "message";
          let dataStr = "";

          const eventMatch = trimmed.match(/^event:\s*(.+)$/m);
          if (eventMatch) eventType = eventMatch[1].trim();

          const dataMatch = trimmed.match(/^data:\s*(.+)$/m);
          if (dataMatch) dataStr = dataMatch[1].trim();

          if (eventType === "analysis") {
            try {
              const parsed = JSON.parse(dataStr);
              capturedAnalysis = parsed.analysis;
              capturedSafetyMode = parsed.safetyMode;
              setMessages((m) =>
                m.map((x) =>
                  x.id === assistantMsgId
                    ? {
                        ...x,
                        analysis: capturedAnalysis,
                        safetyMode: capturedSafetyMode,
                      }
                    : x
                )
              );
            } catch (err) {
              console.warn("Analysis parse notice:", err);
            }
          } else if (eventType === "chunk") {
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                streamedText += parsed.text;
                setMessages((m) =>
                  m.map((x) =>
                    x.id === assistantMsgId ? { ...x, content: streamedText } : x
                  )
                );
              }
            } catch (err) {
              console.warn("Chunk parse notice:", err);
            }
          } else if (eventType === "error") {
            try {
              const parsed = JSON.parse(dataStr);
              throw new Error(parsed.error || "Streaming error");
            } catch (err) {
              throw err;
            }
          }
        }
      }

      // Save short text summary to Firestore messages table (strictly NO image stored)
      if (streamedText) {
        const shortSummary = `[Photo Skin Analysis] Skin type: ${
          capturedAnalysis?.skin_type_guess?.value || "unclear"
        }, Acne: ${capturedAnalysis?.acne?.level || "none"}.\n\n${streamedText}`;
        try {
          await addDoc(collection(db, "messages"), {
            user_id: user.uid,
            role: "assistant",
            content: shortSummary,
            createdAt: optimisticAssistant.createdAt,
          });
        } catch (dbErr) {
          console.warn("Firestore assistant write notice:", dbErr);
        }
      }
    } catch (err) {
      setPhotoError(err.message);
      setMessages((m) => m.filter((x) => x.id !== assistantMsgId));
    } finally {
      setAnalyzingPhoto(false);
      setStreaming(false);
      setPendingPhoto(null);
    }
  }

  async function send(text = input) {
    text = text.trim();
    if (!text || streaming || analyzingPhoto || !user) return;
    setInput("");
    setError("");

    const optimistic = {
      id: `u-${Date.now()}`,
      user_id: user.uid,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((m) => [...m, optimistic]);
    setHistory((h) => [...h, optimistic]);
    setStreaming(true);

    try {
      await addDoc(collection(db, "messages"), {
        user_id: user.uid,
        role: "user",
        content: text,
        createdAt: optimistic.createdAt,
      });
    } catch (dbErr) {
      console.warn("Firestore user message write notice:", dbErr);
    }

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          profile,
          modelChoice,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "The assistant could not respond. Please try again.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      const assistantMsg = {
        id: `a-${Date.now()}`,
        user_id: user.uid,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setMessages((m) => [...m, assistantMsg]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((m) =>
          m.map((x) => (x.id === assistantMsg.id ? { ...x, content: full } : x))
        );
      }

      if (full) {
        try {
          await addDoc(collection(db, "messages"), {
            user_id: user.uid,
            role: "assistant",
            content: full,
            createdAt: assistantMsg.createdAt,
          });
        } catch (dbErr) {
          console.warn("Firestore assistant write notice:", dbErr);
        }
      }
    } catch (e) {
      setError(e.message);
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
    } finally {
      setStreaming(false);
    }
  }

  function startNewChat() {
    setMessages([]);
    setPendingPhoto(null);
    setPhotoError("");
    setError("");
  }

  if (loading) {
    return (
      <section className="card center" style={{ margin: "40px auto", maxWidth: 480 }}>
        <div className="eyebrow">Claire</div>
        <h2>Loading your consultation…</h2>
        <p className="muted">Retrieving your skin diagnostics and personalized notes.</p>
      </section>
    );
  }

  return (
    <div className="chat-layout">
      <section className="conversation" style={{ position: "relative" }}>
        <div className="chat-orb" aria-hidden />

        <header className="chat-head">
          <div className="chat-head-id">
            <ClaireAvatar />
            <div>
              <h2 className="chat-head-name">Claire</h2>
              <p className="muted chat-head-role">Twacha&rsquo;s skincare assistant</p>
            </div>
          </div>
          <div className="chat-head-actions">
            <label className="chat-model-label" htmlFor="model-select">
              Advice depth
            </label>
            <select
              id="model-select"
              className="model-select"
              value={modelChoice}
              onChange={(e) => setModelChoice(e.target.value)}
            >
              <option value="general">Balanced</option>
              <option value="pro">Deep Clinical</option>
              <option value="fast">Rapid Advice</option>
            </select>
          </div>
        </header>

        <div className="messages" tabIndex={0} aria-label="Conversation messages">
          {messages.length === 0 && (
            <div className="center chat-intro">
              <div className="eyebrow">Personal Skincare Guidance</div>
              <h2>Chat with Claire</h2>
              <p className="muted" style={{ maxWidth: 540, margin: "0 auto" }}>
                Ask Claire about current skin concerns, formulation pairings, or upload a skin photo for
                instant clinical vision observation and bespoke routine recommendations.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <motion.div
              className={`bubble-row ${m.role}`}
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {m.role === "assistant" && <ClaireAvatar />}
              <div className={`bubble ${m.role}`}>
                {m.analysis && (
                  <AnalysisCard analysis={m.analysis} safetyMode={m.safetyMode} />
                )}
                {m.role === "assistant" ? (
                  <>
                    <span className="bubble-label">Claire</span>
                    <Markdown>{m.content}</Markdown>
                  </>
                ) : (
                  m.content
                )}
              </div>
            </motion.div>
          ))}

          {analyzingPhoto && (
            <div className="bubble-row assistant">
              <ClaireAvatar />
              <div className="bubble assistant" style={{ background: "var(--blush-soft)" }}>
                <span className="bubble-label">Claire</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="analysis-badge" style={{ animation: "pulse 1.5s infinite" }}>
                    ✦ AI Vision Active
                  </span>
                  <span style={{ fontSize: "0.9rem", color: "var(--maroon)" }}>
                    Observing skin photo with clinical AI…
                  </span>
                </div>
              </div>
            </div>
          )}

          {streaming && !analyzingPhoto && (
            <div className="bubble-row assistant">
              <ClaireAvatar />
              <div className="claire-typing" aria-label="Claire is typing">
                <span className="typing-label">Claire is typing</span>
                <span className="typing">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          )}
          <div ref={end} />
        </div>

        {messages.length === 0 && (
          <div className="suggestions" aria-label="Conversation starters">
            {starters.map((x) => (
              <button key={x} onClick={() => send(x)}>
                ✦ {x}
              </button>
            ))}
          </div>
        )}

        {/* Photo Analysis Bar with Required Consent Line */}
        <div className="photo-analyze-bar">
          <div className="photo-consent">
            Upload only your own photo or one you have permission to use. Photos are analysed and not stored.
          </div>

          <div className="photo-actions-row">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleFileSelected}
            />
            <button
              type="button"
              className="photo-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzingPhoto || streaming}
              aria-label="Analyze my skin photo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Analyze my skin photo</span>
            </button>
          </div>

          {/* Small Preview Tray before upload */}
          <AnimatePresence>
            {pendingPhoto && (
              <motion.div
                className="photo-preview-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <img
                  src={pendingPhoto.dataUrl}
                  alt="Selected skin observation preview"
                  className="photo-thumb"
                />
                <div className="photo-preview-info">
                  <strong>Photo Ready</strong>
                  <div className="muted" style={{ fontSize: "0.76rem" }}>
                    Resized & compressed client-side to 1024px
                  </div>
                </div>
                <div className="photo-preview-actions">
                  <Button
                    onClick={runPhotoAnalysis}
                    disabled={analyzingPhoto || streaming}
                    style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                  >
                    {analyzingPhoto ? "Observing…" : "Analyze"}
                  </Button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setPendingPhoto(null)}
                    disabled={analyzingPhoto}
                    style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {photoError && <p className="error">{photoError}</p>}
        {error && <p className="error">{error}</p>}

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            aria-label="Your skincare question"
            placeholder="Ask about ingredients, acne, dryness, or routines…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button type="submit" disabled={streaming || analyzingPhoto || !input.trim()}>
            Consult
          </Button>
        </form>
      </section>
    </div>
  );
}
