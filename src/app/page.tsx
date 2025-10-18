"use client";

import Link from "next/link";
import {
  FiFileText,
  FiLayers,
  FiAlertTriangle,
  FiPlayCircle,
  FiStar,
  FiCheckCircle,
} from "react-icons/fi";
import Image from "next/image";
import GlobalFooter from "@/components/GlobalFooter";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import styles from "./homepage.module.css";

export default function HomePage() {
  return (
    <>
      <ProjectGlobalHeader logoPriority={true} />
      <main className={styles.homepage} aria-label="Homepage">
        {/* Hero Section */}
        <div className={styles.heroPanel}>
          <div className={styles.heroPanelBg}>
            <Image
              src="/background1.jpg"
              alt="Food manufacturing background"
              fill
              priority
              style={{ objectFit: "cover", objectPosition: "center top" }}
            />
            <div className={styles.heroPanelOverlay} />
          </div>
          <div className={styles.heroPanelContent}>
            <h1 className={styles.heroTitle}>Welcome to Naranja</h1>
            <p className={styles.heroSubtitle}>
              Professional training & compliance solutions for food manufacturing.
              <br />
              Streamline SOPs, policies, risk assessments, and training with our comprehensive platform.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.contentWrapper}>
          <div className={styles.mainPanel}>
            {/* Background Image */}
            <div className={styles.backgroundImage}>
              <Image
                src="/unpeeledoranges.jpg"
                alt="Fresh oranges"
                fill
                style={{ objectFit: "cover", objectPosition: "center" }}
              />
              <div className={styles.backgroundOverlay} />
            </div>
            
            {/* Problem & Solution Section */}
            <div className={styles.cardsGrid}>
              <div className={styles.problemSolutionCard}>
                <h2 className={styles.cardTitle}>
                  <FiAlertTriangle />
                  The Challenge
                </h2>
                <ul className={styles.cardList}>
                  <li>Scattered SOPs and outdated document versions</li>
                  <li>Difficult to track training completion and compliance</li>
                  <li>Time-consuming audit preparation and gaps in evidence</li>
                </ul>
                <hr className={styles.cardDivider} />
                <h2 className={styles.cardTitle}>
                  <FiCheckCircle />
                  Our Solution
                </h2>
                <ul className={styles.cardList}>
                  <li>Centralized document management with version control</li>
                  <li>Automated training assignments and progress tracking</li>
                  <li>Real-time compliance dashboards and audit-ready reports</li>
                </ul>
              </div>

              <div className={styles.problemSolutionCard}>
                <h2 className={styles.cardTitle}>
                  <FiStar />
                  Why Choose Naranja
                </h2>
                <ul className={styles.cardList}>
                  <li>Purpose-built for food manufacturing compliance</li>
                  <li>Intuitive interface that teams actually want to use</li>
                  <li>Comprehensive audit trails and evidence management</li>
                  <li>Scalable solution that grows with your business</li>
                </ul>
              </div>
            </div>

            {/* Features Section */}
            <div className={styles.featuresContainer}>
              <div className={styles.featuresGrid}>
                {FEATURES.map(({ Icon, title, text, href }, i) => (
                <Link key={href || i} href={href} className={`${styles.featureCard} ${title.includes('Health & Safety') ? styles.safetyCard : ''} ${title.includes('Instructional Media') ? styles.sopCard : ''} ${title.includes('SOPs & Policies') ? styles.policyCard : ''} ${title.includes('Turkus') ? styles.turkusCard : ''}`}>
                  {title.includes('Health & Safety') && (
                    <div className={styles.safetyBackground}>
                      <Image
                        src="/safety%20helmets%20and%20vests.jpg"
                        alt="Safety helmets and vests"
                        fill
                        style={{ objectFit: "cover", objectPosition: "center" }}
                      />
                      <div className={styles.safetyOverlay} />
                    </div>
                  )}
                  {title.includes('Instructional Media') && (
                    <div className={styles.sopBackground}>
                      <Image
                        src="/orange%20juice%20factory.jpg"
                        alt="Orange juice factory"
                        fill
                        style={{ objectFit: "cover", objectPosition: "center" }}
                      />
                      <div className={styles.sopOverlay} />
                    </div>
                  )}
                  {title.includes('SOPs & Policies') && (
                    <div className={styles.policyBackground}>
                      <Image
                        src="/policy.jpg"
                        alt="Policy documents"
                        fill
                        style={{ objectFit: "cover", objectPosition: "center" }}
                      />
                      <div className={styles.policyOverlay} />
                    </div>
                  )}
                  {title.includes('Turkus') && (
                    <div className={styles.turkusBackground}>
                      <Image
                        src="/auditor.jpg"
                        alt="Auditor"
                        fill
                        style={{ objectFit: "cover", objectPosition: "center" }}
                      />
                      <div className={styles.turkusOverlay} />
                    </div>
                  )}
                  <div className={styles.featureHeader}>
                    <Icon className={styles.featureIcon} />
                    <h3 className={styles.featureTitle}>{title}</h3>
                  </div>
                  <p className={styles.featureDescription}>{text}</p>
                </Link>
              ))}
              </div>
            </div>

            {/* Metrics Section */}
            <div className={styles.metricsGrid}>
              <div className={`${styles.metricCard} ${styles.success}`}>
                <div className={styles.metricValue}>98%</div>
                <div className={styles.metricLabel}>Training Completion</div>
              </div>
              <div className={`${styles.metricCard} ${styles.info}`}>
                <div className={styles.metricValue}>100%</div>
                <div className={styles.metricLabel}>Audit Readiness</div>
              </div>
              <div className={`${styles.metricCard} ${styles.warning}`}>
                <div className={styles.metricValue}>24/7</div>
                <div className={styles.metricLabel}>Access Anywhere</div>
              </div>
              <div className={`${styles.metricCard} ${styles.error}`}>
                <div className={styles.metricValue}>Zero</div>
                <div className={styles.metricLabel}>Lost Documents</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTO Message Section */}
        <div className={styles.ctoPanel}>
          <div className={styles.ctoContent}>
            <div className={styles.ctoIcon}>
              <FiStar />
            </div>
            <div className={styles.ctoText}>
              <h3 className={styles.ctoTitle}>
                Our Purpose is Simple 
                <span className={styles.ctoHighlight}>
                  — To help food and drink businesses keep their people safe
                </span>
              </h3>
              <blockquote className={styles.ctoQuote}>
                "We built Naranja to help food and drink businesses keep
                their people safe and deliver the highest quality products to
                consumers. By taking care of compliance, training, and audit
                readiness, we free you to focus on what matters most — running
                your operation and making great products."
              </blockquote>
            </div>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </>
  );
}

const FEATURES = [
  {
    Icon: FiFileText,
    title: "SOPs & Policies",
    text: "Create, assign, and manage controlled documents with acknowledgments & audit trail.",
    href: "/homepage/sops-policies",
  },
  {
    Icon: FiLayers,
    title: "Turkus",
    text: "Your single source of truth: versioned docs, linked to modules and roles.",
    href: "/homepage/turkus",
  },
  {
    Icon: FiAlertTriangle,
    title: "Health & Safety Management",
    text: "Assign and track risk controls with evidence, sign-off, and reminders.",
    href: "/homepage/managing-risks",
  },
  {
    Icon: FiPlayCircle,
    title: "Instructional Media",
    text: "Embed videos and visuals straight into training to boost retention.",
    href: "/homepage/instructional-media",
  },
];