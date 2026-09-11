"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface Problem {
  id: string;
  title: string;
  description: string;
  requirements: string;
  createdAt: string;
  _count: { submissions: number };
}

const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  "Design a Parking Lot": { label: "Medium", color: "#fbbf24" },
  "Design a Vending Machine": { label: "Medium", color: "#fbbf24" },
  "Design an Elevator System": { label: "Hard", color: "#f87171" },
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/problems")
      .then((r) => r.json())
      .then((data) => {
        setProblems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
              <Link href="/problems" className={`${styles.navLink} ${styles.navLinkActive}`}>
                Problems
              </Link>
              <Link href="/history" className={styles.navLink}>
                My History
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <section className={styles.content}>
        <div className="container">
          <div className={`${styles.pageHeader} animate-fade-in`}>
            <div className={styles.heroBadge}>📚 Problem Bank</div>
            <h1 className="section-title">
              Choose a <span className="text-gradient">Design Challenge</span>
            </h1>
            <p className="section-subtitle">
              Pick a problem, write your class diagram and pseudo-code in the editor, then get instant AI-powered feedback.
            </p>
          </div>

          {loading ? (
            <div className={styles.loadingGrid}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={`glass-panel ${styles.skeleton}`} />
              ))}
            </div>
          ) : problems.length === 0 ? (
            <div className={`glass-panel ${styles.emptyState}`}>
              <div className={styles.emptyIcon}>🗃️</div>
              <h3>No problems found</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                The database might need seeding. Run <code>node prisma/seed.mjs</code>.
              </p>
            </div>
          ) : (
            <div className={styles.problemGrid}>
              {problems.map((problem, i) => {
                const diff = DIFFICULTY_MAP[problem.title] ?? { label: "Easy", color: "#34d399" };
                return (
                  <div
                    key={problem.id}
                    className={`glass-panel animate-fade-in ${styles.problemCard}`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={styles.cardHeader}>
                      <span
                        className={`badge ${styles.diffBadge}`}
                        style={{
                          background: `${diff.color}22`,
                          color: diff.color,
                          border: `1px solid ${diff.color}66`,
                        }}
                      >
                        {diff.label}
                      </span>
                      <span className={styles.submissionCount}>
                        {problem._count.submissions} submission{problem._count.submissions !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <h2 className={styles.problemTitle}>{problem.title}</h2>
                    <p className={styles.problemDescription}>{problem.description}</p>

                    <div className={styles.requirementsPreview}>
                      <span className={styles.requirementsLabel}>Key Requirements</span>
                      <ul className={styles.requirementsList}>
                        {problem.requirements
                          .split("\n")
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((req, j) => (
                            <li key={j}>{req.replace(/^[-•]\s*/, "")}</li>
                          ))}
                      </ul>
                    </div>

                    <Link
                      href={`/problems/${problem.id}`}
                      className={`btn-primary ${styles.startBtn}`}
                      id={`start-problem-${problem.id}`}
                    >
                      Start Designing →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
