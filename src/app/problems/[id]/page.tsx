"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface Problem {
  id: string;
  title: string;
  description: string;
  requirements: string;
}

interface CheckResult {
  label: string;
  passed: boolean;
  hint?: string;
}

interface FeedbackReport {
  overallScore: number;
  deterministicChecks: CheckResult[];
  aiInsights: string;
  suggestions: string[];
  strengths: string[];
}

interface Submission {
  id: string;
  score: number;
  feedback: string;
  status: string;
}

type PageParams = { id: string };

export default function ProblemPage({ params }: { params: Promise<PageParams> }) {
  const { id } = use(params);

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [content, setContent] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/problems/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProblem(data);
        setLoadingProblem(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoadingProblem(false);
      });
  }, [id]);

  async function handleSubmit() {
    if (!content.trim()) {
      setError("Please write your design before submitting.");
      return;
    }
    setError(null);
    setSubmitting(true);
    setSubmission(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, problemId: id, userName, userEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmission(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const feedback: FeedbackReport | null = (() => {
    if (!submission?.feedback) return null;
    try {
      return JSON.parse(submission.feedback);
    } catch {
      return null;
    }
  })();

  const scoreColor =
    (submission?.score ?? 0) >= 70
      ? "#34d399"
      : (submission?.score ?? 0) >= 40
      ? "#fbbf24"
      : "#f87171";

  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - ((submission?.score ?? 0) / 100) * circumference;

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
              <Link href="/problems" className={styles.navLink}>← Problems</Link>
              <Link href="/history" className={styles.navLink}>My History</Link>
            </div>
          </nav>
        </div>
      </header>

      <div className={`container ${styles.pageBody}`}>
        {loadingProblem ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading problem…</p>
          </div>
        ) : !problem ? (
          <div className={`glass-panel ${styles.errorState}`}>
            <h2>Problem not found</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>{error}</p>
            <Link href="/problems" className="btn-primary" style={{ marginTop: "1.5rem", display: "inline-block" }}>
              Back to Problems
            </Link>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* Left – Problem Description */}
            <aside className={`glass-panel ${styles.problemPanel}`}>
              <Link href="/problems" className={styles.backLink}>← All Problems</Link>
              <h1 className={styles.problemTitle}>{problem.title}</h1>
              <p className={styles.problemDescription}>{problem.description}</p>

              <div className={styles.requirementsBox}>
                <h3 className={styles.sectionLabel}>📋 Requirements</h3>
                <ul className={styles.reqList}>
                  {problem.requirements.split("\n").filter(Boolean).map((req, i) => (
                    <li key={i}>{req.replace(/^[-•]\s*/, "")}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.tipsBox}>
                <h3 className={styles.sectionLabel}>💡 Tips</h3>
                <ul className={styles.tipsList}>
                  <li>Define classes with clear responsibilities (SRP)</li>
                  <li>Use interfaces/abstract classes for extensibility</li>
                  <li>Think about relationships: composition vs inheritance</li>
                  <li>Include design patterns where applicable</li>
                </ul>
              </div>
            </aside>

            {/* Right – Editor + Results */}
            <div className={styles.editorPanel}>
              {/* User fields */}
              <div className={`glass-panel ${styles.userFields}`}>
                <div className={styles.fieldRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="userName">Your Name (optional)</label>
                    <input
                      id="userName"
                      className="form-input"
                      type="text"
                      placeholder="Jane Doe"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="userEmail">Your Email (optional)</label>
                    <input
                      id="userEmail"
                      className="form-input"
                      type="email"
                      placeholder="you@example.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Code editor */}
              <div className={`${styles.editorWrapper}`}>
                <div className={styles.editorHeader}>
                  <span>✏️ Your Design</span>
                  <span className={styles.editorHint}>Pseudo-code, class diagrams, OOP description…</span>
                </div>
                <div className="editor-container">
                  <textarea
                    id="design-editor"
                    className="editor-textarea"
                    placeholder={`// Write your ${problem.title} design here...\n\nclass ParkingLot {\n  private floors: ParkingFloor[]\n  private ticketCounter: int\n\n  +addVehicle(vehicle: Vehicle): Ticket\n  +removeVehicle(ticket: Ticket): Payment\n  +getAvailableSpots(floor: int): ParkingSpot[]\n}\n\ninterface ParkingSpot {\n  +isAvailable(): boolean\n  +assignVehicle(vehicle: Vehicle): void\n}`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    spellCheck={false}
                  />
                </div>
              </div>

              {error && (
                <div className={styles.errorBanner}>
                  ⚠️ {error}
                </div>
              )}

              <button
                id="submit-design-btn"
                className={`btn-primary ${styles.submitBtn}`}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className={styles.btnSpinner} /> Evaluating with AI…
                  </>
                ) : (
                  "Submit for Evaluation →"
                )}
              </button>

              {/* Results */}
              {submission && feedback && (
                <div className={`${styles.resultsSection} animate-fade-in`}>
                  {/* Score Ring */}
                  <div className={`glass-panel ${styles.scorePanel}`}>
                    <div className={styles.scoreRingWrapper}>
                      <svg width="120" height="120" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle
                          cx="50" cy="50" r="44"
                          fill="none"
                          stroke={scoreColor}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          transform="rotate(-90 50 50)"
                          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
                        />
                      </svg>
                      <div className={styles.scoreText} style={{ color: scoreColor }}>
                        <span className={styles.scoreNum}>{submission.score}</span>
                        <span className={styles.scoreMax}>/100</span>
                      </div>
                    </div>
                    <div>
                      <h2 className={styles.scoreLabel}>Your Score</h2>
                      <p className={styles.scoreDesc} style={{ color: scoreColor }}>
                        {(submission.score ?? 0) >= 70 ? "Excellent design! 🎉" : (submission.score ?? 0) >= 40 ? "Good start, keep refining!" : "Needs significant improvements"}
                      </p>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className={`glass-panel ${styles.insightsPanel}`}>
                    <h3 className={styles.panelTitle}>🤖 AI Insights</h3>
                    <p className={styles.insightsText}>{feedback.aiInsights}</p>
                  </div>

                  {/* Strengths & Suggestions */}
                  <div className={styles.twoCol}>
                    {feedback.strengths.length > 0 && (
                      <div className={`glass-panel ${styles.strengthsPanel}`}>
                        <h3 className={styles.panelTitle}>✅ Strengths</h3>
                        <ul className={styles.bulletList}>
                          {feedback.strengths.map((s, i) => (
                            <li key={i} className={styles.strengthItem}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.suggestions.length > 0 && (
                      <div className={`glass-panel ${styles.suggestionsPanel}`}>
                        <h3 className={styles.panelTitle}>💬 Suggestions</h3>
                        <ul className={styles.bulletList}>
                          {feedback.suggestions.map((s, i) => (
                            <li key={i} className={styles.suggestionItem}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Deterministic Checks */}
                  <div className={`glass-panel ${styles.checksPanel}`}>
                    <h3 className={styles.panelTitle}>🔍 Keyword Checks</h3>
                    <div className={styles.checksGrid}>
                      {feedback.deterministicChecks.map((check, i) => (
                        <div key={i} className={`${styles.checkItem} ${check.passed ? styles.checkPass : styles.checkFail}`}>
                          <span className={styles.checkIcon}>{check.passed ? "✓" : "✗"}</span>
                          <div>
                            <span className={styles.checkLabel}>{check.label}</span>
                            {!check.passed && check.hint && (
                              <p className={styles.checkHint}>{check.hint}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.tryAgain}>
                    <button
                      className="btn-secondary"
                      onClick={() => { setSubmission(null); setContent(""); }}
                    >
                      Try Again
                    </button>
                    <Link href="/history" className="btn-secondary" style={{ display: "inline-block", textAlign: "center" }}>
                      View History
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
