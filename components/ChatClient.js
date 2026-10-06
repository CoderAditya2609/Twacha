"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { authenticatedFetch } from "@/lib/auth";
import ProductChip from "@/components/product/ProductChip";
import Button from "@/components/ui/Button";

const starters = ["I have acne on my cheeks, what should I do?", "How can I reduce dullness safely?", "Suggest a simple routine for my skin."];

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
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [sidebar, setSidebar] = useState(true);
  const end = useRef();

  useEffect(() => {
    (async () => {
      const s = getSupabaseBrowser();
      const {
        data: { user },
      } = await s.auth.getUser();
      if (!user) {
        location.href = "/login";
        return;
      }
      const { data: profile } = await s.from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (!profile) {
        location.href = "/onboarding";
        return;
      }
      const { data } = await s.from("messages").select("id,role,content,created_at").order("created_at", { ascending: true }).limit(100);
      setMessages(data || []);
      setHistory(data || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text = input) {
    text = text.trim();
    if (!text || streaming) return;
    setInput("");
    setError("");
    const optimistic = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, optimistic]);
    setHistory((h) => [...h, optimistic]);
    setStreaming(true);
    try {
      const response = await authenticatedFetch("/api/chat", { method: "POST", body: JSON.stringify({ message: text }) });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      const assistant = { id: `a-${Date.now()}`, role: "assistant", content: "" };
      setMessages((m) => [...m, assistant]);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((m) => m.map((x) => (x.id === assistant.id ? { ...x, content: full } : x)));
      }
    } catch (e) {
      setError(e.message);
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
    } finally {
      setStreaming(false);
    }
  }

  if (loading) return <section className="card">Preparing your personalised space…</section>;

  const past = history.filter((m) => m.role === "user").slice(-12).reverse();

  return (
    <div className={`chat-layout ${sidebar ? "" : "collapsed"}`}>
      <aside className={`sidebar ${sidebar ? "" : "collapsed"}`}>
        <button className="btn ghost sidebar-toggle" onClick={() => setSidebar((v) => !v)} aria-label="Toggle history">
          History
        </button>
        <Button onClick={() => setMessages([])}>New chat</Button>
        <div className="history-list" aria-label="Chat history">
          {past.map((m) => (
            <button key={m.id} className="history-item" onClick={() => setMessages(history)}>
              {m.content.slice(0, 48)}
            </button>
          ))}
        </div>
        <nav>
          <Link className="linkish" href="/products">
            Browse products
          </Link>
          <br />
          <Link className="linkish" href="/profile">
            Edit profile
          </Link>
        </nav>
      </aside>
      <section className="conversation" style={{ position: "relative" }}>
        <div className="chat-orb" aria-hidden />
        <div className="messages">
          {messages.length === 0 && (
            <div className="center">
              <h2>Hello, I’m Twacha’s skincare assistant.</h2>
              <p className="muted">Ask about your routine, a skin concern, or choosing products.</p>
            </div>
          )}
          {messages.map((m) => (
            <motion.div className={`bubble ${m.role}`} key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : m.content}
            </motion.div>
          ))}
          {streaming && (
            <div className="typing" aria-label="Assistant is writing">
              <i />
              <i />
              <i />
            </div>
          )}
          <div ref={end} />
        </div>
        {messages.length === 0 && (
          <div className="suggestions">
            {starters.map((x) => (
              <button key={x} onClick={() => send(x)}>
                {x}
              </button>
            ))}
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            aria-label="Your message"
            placeholder="Ask about your skin…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button type="submit" disabled={streaming}>
            Send
          </Button>
        </form>
      </section>
    </div>
  );
}
