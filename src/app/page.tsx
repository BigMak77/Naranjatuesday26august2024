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
import GlobalFooter from "@/components/ui/GlobalFooter";
import { useTranslation } from "@/context/TranslationContext";
import styles from "./homepage.module.css";

export default function HomePage() {
  const { t } = useTranslation();
  const FEATURES = getFeatures(t);

  return (
    <>
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
            <h1 className={styles.heroTitle}>{t('homepage.heroTitle')}</h1>
            <p className={styles.heroSubtitle}>
              {t('homepage.heroSubtitle')}
              <br />
              {t('homepage.heroSubtitleLine2')}
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
                  {t('homepage.theChallenge')}
                </h2>
                <ul className={styles.cardList}>
                  <li>{t('homepage.challengeItem1')}</li>
                  <li>{t('homepage.challengeItem2')}</li>
                  <li>{t('homepage.challengeItem3')}</li>
                </ul>
                <hr className={styles.cardDivider} />
                <h2 className={styles.cardTitle}>
                  <FiCheckCircle />
                  {t('homepage.ourSolution')}
                </h2>
                <ul className={styles.cardList}>
                  <li>{t('homepage.solutionItem1')}</li>
                  <li>{t('homepage.solutionItem2')}</li>
                  <li>{t('homepage.solutionItem3')}</li>
                </ul>
              </div>

              <div className={styles.problemSolutionCard}>
                <h2 className={styles.cardTitle}>
                  <FiStar />
                  {t('homepage.whyChoose')}
                </h2>
                <ul className={styles.cardList}>
                  <li>{t('homepage.whyItem1')}</li>
                  <li>{t('homepage.whyItem2')}</li>
                  <li>{t('homepage.whyItem3')}</li>
                  <li>{t('homepage.whyItem4')}</li>
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
                <div className={styles.metricLabel}>{t('homepage.trainingCompletion')}</div>
              </div>
              <div className={`${styles.metricCard} ${styles.info}`}>
                <div className={styles.metricValue}>100%</div>
                <div className={styles.metricLabel}>{t('homepage.auditReadiness')}</div>
              </div>
              <div className={`${styles.metricCard} ${styles.warning}`}>
                <div className={styles.metricValue}>24/7</div>
                <div className={styles.metricLabel}>{t('homepage.accessAnywhere')}</div>
              </div>
              <div className={`${styles.metricCard} ${styles.error}`}>
                <div className={styles.metricValue}>Zero</div>
                <div className={styles.metricLabel}>{t('homepage.lostDocuments')}</div>
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
                {t('homepage.ctoPurpose')}
                <span className={styles.ctoHighlight}>
                  {t('homepage.ctoPurposeHighlight')}
                </span>
              </h3>
              <blockquote className={styles.ctoQuote}>
                "{t('homepage.ctoQuote')}"
              </blockquote>
            </div>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </>
  );
}

function getFeatures(t: (key: string) => string) {
  return [
    {
      Icon: FiFileText,
      title: t('homepage.sopsPoliciesTitle'),
      text: t('homepage.sopsPoliciesText'),
      href: "/homepage/sops-policies",
    },
    {
      Icon: FiLayers,
      title: t('homepage.turkusTitle'),
      text: t('homepage.turkusText'),
      href: "/homepage/turkus",
    },
    {
      Icon: FiAlertTriangle,
      title: t('homepage.healthSafetyTitle'),
      text: t('homepage.healthSafetyText'),
      href: "/homepage/managing-risks",
    },
    {
      Icon: FiPlayCircle,
      title: t('homepage.instructionalMediaTitle'),
      text: t('homepage.instructionalMediaText'),
      href: "/homepage/instructional-media",
    },
  ];
}