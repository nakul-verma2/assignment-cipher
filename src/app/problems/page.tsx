"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Problem {
  id: string;
  title: string;
  description: string;
  requirements: string;
  _count: { submissions: number };
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/problems")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load problems");
        return r.json();
      })
      .then(setProblems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ minHeight: "100vh", paddingBottom: "4rem" }}>
      <header className="glass-header" style={{ padding: "1rem 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "1.25rem" }}>
            <span className="text-gradient">LLD</span> Practice
          </Link>
          <nav style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/problems" style={{ color: "var(--text-primary)" }}>Problems</Link>
            <Link href="/history" style={{ color: "var(--text-secondary)" }}>My History</Link>
          </nav>
        </div>
      </header>

      <div className="container" style={{ paddingTop: "3rem" }}>
        <h1 className="section-title">
          Choose a <span className="text-gradient">problem</span>
        </h1>
        <p className="section-subtitle">
          Pick a classic LLD problem, design your classes, and get structured
          feedback on SOLID, patterns, and extensibility.
        </p>

        {loading && <p style={{ color: "var(--text-secondary)" }}>Loading problems…</p>}
        {error && <p style={{ color: "#f87171" }}>{error}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {problems.map((p, i) => (
            <div key={p.id} className="glass-panel animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>{p.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1rem" }}>
                {p.description}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {p._count.submissions} attempts
                </span>
                <Link href={`/problems/${p.id}`} className="btn-primary" style={{ fontSize: "0.9rem" }}>
                  Practice →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
