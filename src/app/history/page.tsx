"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface FeedbackReport {
  overallScore: number;
  deterministicChecks: { label: string; passed: boolean; hint?: string }[];
  aiInsights: string;
  suggestions: string[];
  strengths: string[];
}

interface SubmissionRecord {
  id: string;
  content: string;
  score: number | null;
  feedback: string | null;
  status: string;
  createdAt: string;
  problem: { title: string };
}

export default function HistoryPage() {
  const [email, setEmail] = useState("");
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(false);
    setSubmissions([]);
    try {
      const res = await fetch(`/api/submissions?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setSubmissions(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  function parseFeedback(raw: string | null): FeedbackReport | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const scoreColor = (score: number | null) => {
    if (score === null) return "var(--text-secondary)";
    if (score >= 70) return "#34d399";
    if (score >= 40) return "#fbbf24";
    return "#f87171";
  };

  return (
    <main className={styles.main}>
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      {/* Header */}
      <header className={`glass-header ${styles.header}`}>
        <div className="container">
          <nav className={styles.nav}>
            <Link href="/" className={styles.logo}>
              <span className="text-gradient">LLD</span>
              <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}> Practice</span>
            </Link>
            <div className={styles.navLinks}>
              <Link href="/problems" className={styles.navLink}>Problems</Link>
              <Link href="/history" className={`${styles.navLink} ${styles.navLinkActive}`}>My History</Link>
            </div>
          </nav>
        </div>
      </header>

      <section className={styles.content}>
        <div className="container">
          {/* Page Header */}
          <div className={`${styles.pageHeader} animate-fade-in`}>
            <div className={styles.heroBadge}>📊 Submission History</div>
            <h1 className="section-title">
              Your <span className="text-gradient">Design Journey</span>
            </h1>
            <p className="section-subtitle">
              Track your progress over time. See how your LLD skills have improved across attempts.
            </p>
          </div>

          {/* Search Box */}
          <div className={`glass-panel ${styles.searchPanel} animate-fade-in`}>
            <form onSubmit={handleSearch} className={styles.searchForm} id="history-search-form">
              <div className={styles.searchInputWrapper}>
                <span className={styles.searchIcon}>✉️</span>
                <input
                  id="history-email-input"
                  className={`form-input ${styles.searchInput}`}
                  type="email"
                  placeholder="Enter your email to view history…"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button id="history-search-btn" type="submit" className={`btn-primary ${styles.searchBtn}`} disabled={loading}>
                {loading ? "Searching…" : "View History →"}
              </button>
            </form>
          </div>

          {error && (
            <div className={styles.errorBanner}>⚠️ {error}</div>
          )}

          {/* Results */}
          {searched && (
            <div className={`${styles.results} animate-fade-in`}>
              {submissions.length === 0 ? (
                <div className={`glass-panel ${styles.emptyState}`}>
                  <div className={styles.emptyIcon}>🗃️</div>
                  <h3>No submissions found</h3>
                  <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                    No submissions for <strong>{email}</strong> yet.
                  </p>
                  <Link href="/problems" className="btn-primary" style={{ marginTop: "1.5rem", display: "inline-block" }}>
                    Start Practicing →
                  </Link>
                </div>
              ) : (
                <>
                  <div className={styles.resultsMeta}>
                    <span>{submissions.length} submission{submissions.length !== 1 ? "s" : ""} for <strong>{email}</strong></span>
                    {submissions.length > 0 && (
                      <span className={styles.avgScore}>
                        Avg score:{" "}
                        <strong style={{ color: "#c4b5fd" }}>
                          {Math.round(
                            submissions.reduce((acc, s) => acc + (s.score ?? 0), 0) / submissions.length
                          )}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div className={styles.submissionList}>
                    {submissions.map((sub) => {
                      const fb = parseFeedback(sub.feedback);
                      const isExpanded = expandedId === sub.id;
                      return (
                        <div key={sub.id} className={`glass-panel ${styles.submissionCard}`}>
                          {/* Card Header Row */}
                          <div className={styles.cardRow}>
                            <div className={styles.cardLeft}>
                              <h3 className={styles.problemTitle}>{sub.problem.title}</h3>
                              <span className={styles.dateText}>{formatDate(sub.createdAt)}</span>
                            </div>
                            <div className={styles.cardRight}>
                              {sub.score !== null ? (
                                <div className={styles.scorePill} style={{ color: scoreColor(sub.score), borderColor: `${scoreColor(sub.score)}44`, background: `${scoreColor(sub.score)}11` }}>
                                  <span className={styles.scoreNum}>{sub.score}</span>
                                  <span className={styles.scoreMax}>/100</span>
                                </div>
                              ) : (
                                <span className={`badge badge-${sub.status.toLowerCase()}`}>{sub.status}</span>
                              )}
                              <button
                                id={`expand-submission-${sub.id}`}
                                className={`btn-secondary ${styles.expandBtn}`}
                                onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                              >
                                {isExpanded ? "Hide ↑" : "Details ↓"}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && fb && (
                            <div className={`${styles.expandedContent} animate-fade-in`}>
                              <div className={styles.divider} />

                              {/* AI Insights */}
                              <div className={styles.insightBox}>
                                <span className={styles.insightLabel}>🤖 AI Insights</span>
                                <p className={styles.insightText}>{fb.aiInsights}</p>
                              </div>

                              <div className={styles.twoCol}>
                                {fb.strengths.length > 0 && (
                                  <div className={styles.listBox}>
                                    <span className={styles.listLabel}>✅ Strengths</span>
                                    <ul className={styles.inlineList}>
                                      {fb.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                  </div>
                                )}
                                {fb.suggestions.length > 0 && (
                                  <div className={styles.listBox}>
                                    <span className={styles.listLabel}>💬 Suggestions</span>
                                    <ul className={styles.inlineList}>
                                      {fb.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {/* Keyword Checks */}
                              <div className={styles.checks}>
                                <span className={styles.listLabel}>🔍 Checks</span>
                                <div className={styles.checkPills}>
                                  {fb.deterministicChecks.map((c, i) => (
                                    <span
                                      key={i}
                                      className={`${styles.checkPill} ${c.passed ? styles.checkPillPass : styles.checkPillFail}`}
                                    >
                                      {c.passed ? "✓" : "✗"} {c.label}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Submitted Content */}
                              <details className={styles.submittedDetails}>
                                <summary className={styles.submittedSummary}>View submitted design</summary>
                                <pre className={styles.submittedCode}>{sub.content}</pre>
                              </details>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
