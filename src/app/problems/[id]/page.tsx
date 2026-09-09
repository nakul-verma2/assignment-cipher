"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

interface Problem {
  id: string;
  title: string;
  description: string;
  requirements: string;
}

interface FeedbackReport {
  overallScore: number;
  deterministicChecks: { label: string; passed: boolean; hint?: string }[];
  aiInsights: string;
  suggestions: string[];
  strengths: string[];
}

interface Submission {
  id: string;
  content: string;
  feedback: string | null;
  score: number | null;
  status: string;
  createdAt: string;
}

const STARTER_TEMPLATE = `// Describe your LLD: classes, responsibilities, relationships, patterns.
// Example structure:
//
// class ParkingLot {
//   floors: ParkingFloor[];
//   ...
// }
//
// Mention key entities explicitly (e.g. ParkingSpot, Vehicle, Ticket, Payment)
// so deterministic checks can recognise them.

class <YourMainClass> {
  // responsibilities...
}
`;

function parseFeedback(raw: string | null): FeedbackReport | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [content, setContent] = useState(STARTER_TEMPLATE);
  const [email, setEmail] = useState("learner@example.com");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [latest, setLatest] = useState<Submission | null>(null);
  const [history, setHistory] = useState<Submission[]>([]);

  useEffect(() => {
    fetch(`/api/problems/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Problem not found");
        return r.json();
      })
      .then(setProblem)
      .catch((e) => setError(e.message));
  }, [id]);

  const loadHistory = (userEmail: string) => {
    fetch(`/api/submissions?email=${encodeURIComponent(userEmail)}&problemId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
          if (data.length > 0) setLatest(data[0]);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadHistory(email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, problemId: id, userEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setLatest(data);
      loadHistory(email);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const report = parseFeedback(latest?.feedback ?? null);

  return (
    <main style={{ minHeight: "100vh", paddingBottom: "4rem" }}>
      <header className="glass-header" style={{ padding: "1rem 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
            <span className="text-gradient">LLD</span> Practice
          </Link>
          <nav style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/problems" style={{ color: "var(--text-secondary)" }}>Problems</Link>
            <Link href="/history" style={{ color: "var(--text-secondary)" }}>My History</Link>
          </nav>
        </div>
      </header>

      <div className="container" style={{ paddingTop: "2rem" }}>
        {error && !problem && <p style={{ color: "#f87171" }}>{error}</p>}
        {!problem && !error && <p>Loading…</p>}
        {problem && (
          <>
            <Link href="/problems" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              ← All problems
            </Link>
            <h1 className="section-title" style={{ marginTop: "0.5rem" }}>{problem.title}</h1>
            <p className="section-subtitle">{problem.description}</p>

            <div className="glass-panel" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ marginBottom: "0.75rem" }}>Requirements</h3>
              <pre style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)", fontSize: "0.95rem", fontFamily: "inherit" }}>
                {problem.requirements}
              </pre>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="practice-grid">
              <div>
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label" htmlFor="email">Your email (to track history)</label>
                  <input
                    id="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => loadHistory(email)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="editor-container">
                  <textarea
                    className="editor-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    spellCheck={false}
                  />
                </div>
                {error && <p style={{ color: "#f87171", marginTop: "0.75rem" }}>{error}</p>}
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ marginTop: "1rem", opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? "Evaluating…" : "Submit for feedback"}
                </button>
                {submitting && (
                  <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
                    Running deterministic checks + AI review… (status: EVALUATING)
                  </p>
                )}
              </div>

              <div>
                <h3 style={{ marginBottom: "1rem" }}>Feedback</h3>
                {!latest && <p style={{ color: "var(--text-secondary)" }}>Submit your design to see scored feedback here.</p>}
                {latest && (
                  <div className="glass-panel">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <span className={`badge badge-${latest.status.toLowerCase()}`}>{latest.status}</span>
                      {latest.score != null && (
                        <strong style={{ fontSize: "1.5rem" }}>{latest.score}<span style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>/100</span></strong>
                      )}
                    </div>
                    {latest.status === "FAILED" && (
                      <p style={{ color: "#f87171" }}>Evaluation failed. Please retry your submission.</p>
                    )}
                    {report && (
                      <>
                        <p style={{ marginBottom: "1rem" }}>{report.aiInsights}</p>
                        <h4 style={{ marginBottom: "0.5rem" }}>Deterministic checks</h4>
                        <ul style={{ listStyle: "none", marginBottom: "1rem" }}>
                          {report.deterministicChecks.map((c, i) => (
                            <li key={i} style={{ marginBottom: "0.35rem", fontSize: "0.95rem" }}>
                              {c.passed ? "✅" : "❌"} {c.label}
                              {!c.passed && c.hint && (
                                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{c.hint}</div>
                              )}
                            </li>
                          ))}
                        </ul>
                        {report.strengths.length > 0 && (
                          <>
                            <h4>Strengths</h4>
                            <ul style={{ marginLeft: "1.25rem", marginBottom: "1rem", color: "var(--text-secondary)" }}>
                              {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </>
                        )}
                        {report.suggestions.length > 0 && (
                          <>
                            <h4>Suggestions</h4>
                            <ul style={{ marginLeft: "1.25rem", color: "var(--text-secondary)" }}>
                              {report.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {history.length > 1 && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <h4 style={{ marginBottom: "0.5rem" }}>Previous attempts ({history.length})</h4>
                    {history.slice(1, 4).map((h) => (
                      <div key={h.id} style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                        {new Date(h.createdAt).toLocaleString()} — {h.status} {h.score != null ? `· ${h.score}/100` : ""}
                      </div>
                    ))}
                    <Link href="/history" style={{ fontSize: "0.9rem", color: "#c4b5fd" }}>View full history →</Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`@media (max-width: 900px) { .practice-grid { grid-template-columns: 1fr !important; } }`}</style>
    </main>
  );
}
