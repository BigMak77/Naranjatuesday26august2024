"use client";

import Link from "next/link";
import Script from "next/script";
import {
  FiFileText,
  FiLayers,
  FiAlertTriangle,
  FiPlayCircle,
  FiMail,
  FiStar,
} from "react-icons/fi";
import Image from "next/image";
import NeonIconButton from "@/components/ui/NeonIconButton";

export default function HomePage() {
  return (
    <main className="homepage" aria-label="Homepage">
      {/* JSON-LD for better SEO */}
      <Script
        type="application/ld+json"
        id="org-jsonld"
        strategy="afterInteractive"
      >
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Naranja — Training & Compliance for Food Manufacturing",
          url: "https://your-domain.example",
          logo: "https://your-domain.example/logo.png",
          sameAs: [
            "https://www.linkedin.com/company/your-company",
            "https://x.com/your-company",
          ],
        })}
      </Script>

      {/* Full-width hero panel */}
      <div
        className="homepage-fullwidth-panel"
        style={{
          position: "relative",
          width: "100vw",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
          height: "120px",
          overflow: "hidden",
        }}
      >
        <div
          className="homepage-panel-bg"
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        >
          <Image
            src="/background1.jpg"
            alt="Food manufacturing background"
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
        </div>
        <div
          className="homepage-panel-inner"
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h2 className="homepage-panel-title">Welcome to Naranja</h2>
          <p className="homepage-panel-desc">
            Training & Compliance for Food Manufacturing. Streamline SOPs,
            policies, risk assessments, and training with a beautiful, auditable
            platform.
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="homepage-action-panel"
        style={{
          position: "relative",
          width: "100vw",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "2rem",
          background: "rgba(215, 111, 7, 0.91)",
          borderBottom: "1px solid #eee",
        }}
      >
        <NeonIconButton
          as="link"
          href="/contact-us"
          variant="view"
          title="Contact Us"
        />
        <NeonIconButton
          as="link"
          href="/features"
          variant="star"
          title="Features"
        />
        <NeonIconButton
          as="link"
          href="/about"
          variant="info"
          title="About Us"
        />
        <NeonIconButton
          as="link"
          href="/login"
          variant="login"
          title="Log In"
        />
      </div>

      {/* Full-bleed wrapper to escape any parent max-width */}
      <div
        className="cards-bleed-wrapper"
        style={{
          position: "relative",
          width: "100vw",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
        }}
      >
        {/* White panel */}
        <div
          className="homepage-cards-panel"
          style={{
            width: "calc(100% - 4rem)",
            margin: "2rem auto",
            background: "#fff",
            borderRadius: "18px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            padding: "1rem",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* Cards row */}
          <div
            className="homepage-cards-row"
            style={{
              display: "flex",
              gap: "0.5rem",
              height: "320px",
              minWidth: "calc(756px + 300px + 0.5rem)",
              width: "100%",
              margin: "0 auto",
            }}
          >
            {/* Left card */}
            <div
              className="homepage-card-large"
              style={{
                flex: "1 1 0",
                minWidth: "580px",
                background: "#19e6d9",
                borderRadius: "14px",
                padding: "2rem",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#222",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiAlertTriangle style={{ fontSize: "1.25em" }} />
                The problem
              </h2>
              <ul
                style={{
                  margin: "0.75rem 0 0",
                  paddingLeft: "1.25rem",
                  fontSize: "1.08rem",
                  fontWeight: 500,
                  color: "#222",
                }}
              >
                <li>Scattered SOPs and outdated versions</li>
                <li>No easy way to prove who’s trained on what</li>
                <li>Audit scramble and risky gaps in compliance</li>
              </ul>

              <h2
                style={{
                  margin: "1.25rem 0 0",
                  color: "#ff5a36",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiFileText style={{ fontSize: "1.25em" }} />
                Our solution
              </h2>
              <ul
                style={{
                  margin: "0.75rem 0 0",
                  paddingLeft: "1.25rem",
                  fontSize: "1.08rem",
                  fontWeight: 500,
                  color: "#222",
                }}
              >
                <li>Single source of truth for every controlled document</li>
                <li>Role-based assignment, acknowledgements, and evidence</li>
                <li>Real-time dashboards and effortless audit trails</li>
              </ul>
            </div>

            {/* Right cards with inline icon + title */}
            <div
              className="homepage-card-rights"
              style={{
                flex: "1.5 1 0",
                minWidth: "460px",
                display: "grid",
                gridTemplateRows: "repeat(4, 1fr)",
                gap: "0.5rem",
              }}
            >
              {FEATURES.map(({ Icon, title, text, href }, i) => {
                const colors = ["#ffb347", "#19e6d9", "#4f8cff", "#ff5ad1"];
                return (
                  <Link
                    key={title}
                    href={href}
                    style={{
                      background: colors[i % colors.length],
                      borderRadius: "14px",
                      border: "1.5px solid #e0e0e0",
                      boxShadow:
                        "0 2px 12px rgba(0,0,0,0.07), 0 1.5px 0 rgba(255,255,255,0.4) inset",
                      textDecoration: "none",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      padding: "0.5rem 1rem", // reduced top/bottom padding
                      gap: "0.5rem",
                      color: "#222",
                    }}
                  >
                    {/* Title row with inline icon */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        lineHeight: 1.2,
                      }}
                    >
                      <Icon style={{ fontSize: "1.25em" }} />
                      {title}
                    </div>

                    {/* Description */}
                    <div
                      style={{
                        fontSize: "0.96rem",
                        color: "#333",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {text}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global overrides */}
        <style jsx global>{`
          .homepage-cards-panel {
            max-width: none !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          main.homepage > .homepage-cards-panel,
          .container .homepage-cards-panel {
            max-width: none !important;
          }
          .homepage-cards-panel .homepage-card-large h2 {
            margin: 0 !important;
          }
          .homepage-cards-panel .homepage-card-large ul {
            margin: 0 !important;
            padding-left: 1.rem !important;
          }
        `}</style>
      </div>
    </main>
  );
}

const FEATURES = [
  {
    Icon: FiFileText,
    title: "SOPs & Policies",
    text: "Create, assign, and manage controlled documents with acknowledgments & audit trail.",
    href: "/policies-and-procedures",
  },
  {
    Icon: FiLayers,
    title: "SmartDoc",
    text: "Your single source of truth: versioned docs, linked to modules and roles.",
    href: "/smartdoc",
  },
  {
    Icon: FiAlertTriangle,
    title: "Risk Assessments",
    text: "Assign and track risk controls with evidence, sign-off, and reminders.",
    href: "/managing-risks",
  },
  {
    Icon: FiPlayCircle,
    title: "Instructional Media",
    text: "Embed videos and visuals straight into training to boost retention.",
    href: "/instructional-media",
  },
];
