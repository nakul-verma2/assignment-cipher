import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Background orbs */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      {/* Header */}
      <header className={`glass-header ${styles.header}`}>
        <div className="container">
          <nav className={styles.nav}>
            <div className={styles.logo}>
              <span className="text-gradient">LLD</span>
              <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
                {" "}
                Practice
              </span>
            </div>
            <div className={styles.navLinks}>
              <Link href="/problems" className={styles.navLink}>
                Problems
              </Link>
              <Link href="/history" className={styles.navLink}>
                My History
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={`${styles.heroContent} animate-fade-in`}>
            <div className={styles.heroBadge}>🎯 AI-Powered LLD Feedback</div>
            <h1 className={`section-title ${styles.heroTitle}`}>
              Master{" "}
              <span className="text-gradient">Low-Level Design</span>
              <br />
              With Real Feedback
            </h1>
            <p className="section-subtitle">
              Practice LLD problems like Parking Lot, Vending Machine, and
              Elevator System. Get instant, AI-powered feedback on your design
              decisions and iteratively improve.
            </p>
            <div className={styles.heroCta}>
              <Link href="/problems" className="btn-primary">
                Start Practicing →
              </Link>
              <Link href="/problems" className="btn-secondary">
                Browse Problems
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.featureGrid}>
            <div className={`glass-panel animate-fade-in delay-100 ${styles.featureCard}`}>
              <div className={styles.featureIcon}>🧠</div>
              <h3>Thoughtful Feedback</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                Our AI evaluates your design against SOLID principles, not just
                a rigid answer key.
              </p>
            </div>
            <div className={`glass-panel animate-fade-in delay-200 ${styles.featureCard}`}>
              <div className={styles.featureIcon}>⚡</div>
              <h3>Instant Evaluation</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                Submit your class diagrams and pseudo-code, get scored in
                seconds with actionable tips.
              </p>
            </div>
            <div className={`glass-panel animate-fade-in delay-300 ${styles.featureCard}`}>
              <div className={styles.featureIcon}>📈</div>
              <h3>Track Progress</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                Review all your past attempts, see how your designs improved
                across iterations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
