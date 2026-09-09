"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Submission {
  id: string;
  content: string;
  score: number | null;
  status: string;
  createdAt: string;
  problem: { title: string };
}

export default function HistoryPage() {
  const [email, setEmail] = useState("learner@example.com");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = (e: string) => {
    setLoading(true);
    setError("");
    fetch(`/api/submissions?email=${encodeURIComponent(e)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load history");
        return r.json();
      })
      .then(setSubmissions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // Initial load on mount (user-triggered loads go through the Load button)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial fetch on mount
    load(email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ minHeight: "100vh", paddingBottom: "4rem" }}>
      <header className="glass-header" style={{ padding: "1rem 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
            <span className="text-gradient">LLD</span> Practice
          </Link>
          <nav style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/problems" style={{ color: "var(--text-secondary)" }}>Problems</Link>
            <Link href="/history" style={{ color: "var(--text-primary)" }}>My History</Link>
          </nav>
        </div>
      </header>

      <div className="container" style={{ paddingTop: "3rem" }}>
        <h1 className="section-title">Attempt <span className="text-gradient">history</span></h1>
        <p className="section-subtitle">Review past submissions to track improvement across iterations.</p>

        <div className="form-group" style={{ maxWidth: "400px", display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn-secondary" onClick={() => load(email)}>Load</button>
        </div>

        {loading && <p style={{ color: "var(--text-secondary)" }}>Loading…</p>}
        {error && <p style={{ color: "#f87171" }}>{error}</p>}
        {!loading && submissions.length === 0 && !error && (
          <p style={{ color: "var(--text-secondary)" }}>No attempts yet. <Link href="/problems" style={{ color: "#c4b5fd" }}>Start practicing →</Link></p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {submissions.map((s) => (
            <div key={s.id} className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <strong>{s.problem.title}</strong>
                <span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span>
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                {new Date(s.createdAt).toLocaleString()}
                {s.score != null && <span> · Score: <strong style={{ color: "var(--text-primary)" }}>{s.score}/100</strong></span>}
              </div>
              <details style={{ marginTop: "0.75rem" }}>
                <summary style={{ cursor: "pointer", color: "#c4b5fd" }}>View submission</summary>
                <pre style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", maxHeight: "300px", overflow: "auto" }}>
                  {s.content.slice(0, 2000)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
