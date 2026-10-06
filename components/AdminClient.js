"use client";
import { useEffect, useState } from "react";
import products from "@/data/products.json";
import { authenticatedFetch } from "@/lib/auth";
import Field from "@/components/ui/Field";
import Card from "@/components/ui/Card";

function CountUp({ value }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    const start = performance.now();
    const dur = 900;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return n;
}

export default function AdminClient() {
  const [conversion, setConversion] = useState(5);
  const [aov, setAov] = useState(600);
  const [commission, setCommission] = useState(8);
  const [initial, setInitial] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authenticatedFetch("/api/admin")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json();
      })
      .then(setInitial)
      .catch((e) => setError(e.message));
  }, []);

  if (error)
    return (
      <Card>
        <h2>Access denied</h2>
        <p>{error}</p>
      </Card>
    );
  if (!initial) return <Card>Loading dashboard…</Card>;

  const earnings = initial.clicks * (Number(conversion) / 100) * Number(aov) * (Number(commission) / 100);
  const rows = products.filter((p) => initial.byProduct[p.id]);
  const max = Math.max(1, ...rows.map((p) => initial.byProduct[p.id]));

  return (
    <>
      <section className="stats">
        <div className="stat">
          <strong>
            <CountUp value={initial.users} />
          </strong>
          total users
        </div>
        <div className="stat">
          <strong>
            <CountUp value={initial.chats} />
          </strong>
          chat messages
        </div>
        <div className="stat">
          <strong>
            <CountUp value={initial.clicks} />
          </strong>
          affiliate clicks
        </div>
      </section>
      <Card>
        <h2>Estimate assumptions</h2>
        <div className="form-grid">
          <Field label="Conversion rate (%)" type="number" min="0" value={conversion} onChange={(e) => setConversion(e.target.value)} />
          <Field label="Average order value (₹)" type="number" min="0" value={aov} onChange={(e) => setAov(e.target.value)} />
          <Field label="Commission rate (%)" type="number" min="0" value={commission} onChange={(e) => setCommission(e.target.value)} />
        </div>
        <p className="eyebrow">Hypothetical earnings</p>
        <h2>₹{earnings.toFixed(2)}</h2>
        <p className="muted">Demonstration estimate only — not actual revenue. Formula: clicks × conversion rate × average order value × commission rate.</p>
      </Card>
      <Card style={{ marginTop: 20 }}>
        <h2>Clicks by product</h2>
        {rows.length ? (
          <div className="bars" aria-hidden>
            {rows.map((p) => (
              <div className="bar" key={p.id}>
                <span style={{ height: `${(initial.byProduct[p.id] / max) * 140}px` }} />
                <small>{initial.byProduct[p.id]}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No clicks recorded yet.</p>
        )}
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{initial.byProduct[p.id]}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan="2">No clicks recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
