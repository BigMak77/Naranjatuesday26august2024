"use client";

import Link from "next/link";
import Script from "next/script";
import {
  FiFileText,
  FiLayers,
  FiAlertTriangle,
  FiPlayCircle,
  FiStar,
} from "react-icons/fi";
import Image from "next/image";

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
          background: "#159ca3",
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
          {/* Turquoise overlay filter */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(4, 8, 9, 0.89) 0%, rgba(31, 118, 125, 0.89) 100%)",
              mixBlendMode: "multiply",
              pointerEvents: "none",
              zIndex: 1,
            }}
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
          <h2
            className="homepage-panel-title"
            style={{
              color: "#fff",
              fontSize: "2.4rem",
              fontWeight: 700,
              letterSpacing: "0.01em",
              margin: 0,
            }}
          >
            Welcome to Naranja
          </h2>
          <p
            className="homepage-panel-desc"
            style={{
              color: "#e6f9f8",
              fontSize: "1.18rem",
              fontWeight: 500,
              margin: "0.5rem 0 0 0",
              textAlign: "center",
            }}
          >
            Training & Compliance for Food Manufacturing. Streamline SOPs,
            policies, risk assessments, and training with a beautiful, auditable
            platform.
          </p>
        </div>
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
            background: "#0d3c47", // deep blue/dark turquoise
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
              gap: 0,
              height: "320px",
              minWidth: "calc(756px + 300px)",
              width: "100%",
              margin: "0 auto",
              position: "relative",
            }}
          >
            {/* Left card */}
            <div
              className="homepage-card-large"
              style={{
                flex: "0 0 580px",
                minWidth: "580px",
                maxWidth: "580px",
                background: "#159ca3", // darker turquoise
                borderRadius: "14px",
                paddingLeft: "2rem", // 2rem left padding
                paddingTop: 0,
                paddingBottom: 0,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start", // left align horizontally
                position: "relative",
                zIndex: 1,
                height: "100%",
                color: "#fff", // white text for all content
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#fff",
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
                  color: "#fff",
                }}
              >
                <li>Scattered SOPs and outdated versions</li>
                <li>No easy way to prove who’s trained on what</li>
                <li>Audit scramble and risky gaps in compliance</li>
              </ul>

              <h2
                style={{
                  margin: "1.25rem 0 0",
                  color: "#fff",
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
                  color: "#fff",
                }}
              >
                <li>Single source of truth for every controlled document</li>
                <li>Role-based assignment, acknowledgements, and evidence</li>
                <li>Real-time dashboards and effortless audit trails</li>
              </ul>
            </div>

            {/* Right cards with overlap */}
            <div
              className="homepage-card-rights"
              style={{
                flex: "1 1 0",
                minWidth: "460px",
                display: "grid",
                gridTemplateRows: "repeat(4, 1fr)",
                gap: "0.5rem",
                position: "absolute",
                top: "50%", // center vertically
                left: "calc(580px - 2rem)", // overlap by 2rem over left card
                width: "calc(100% - 580px + 2rem)",
                zIndex: 2,
                transform: "translateY(-50%)", // center vertically
              }}
            >
              {FEATURES.map(({ Icon, title, text, href }, i) => {
                const neonColors = ["#ffb347", "#19e6d9", "#4f8cff", "#ff5ad1"];
                return (
                  <Link
                    key={title}
                    href={href}
                    className={`homepage-feature-card homepage-feature-card-${i}`}
                    style={{
                      background: `linear-gradient(90deg, #159ca3 0%, #159ca3 80%, ${neonColors[i % neonColors.length]} 100%)`,
                      borderRadius: "14px",
                      boxShadow:
                        "0 2px 12px rgba(0,0,0,0.07), 0 1.5px 0 rgba(255,255,255,0.4) inset",
                      textDecoration: "none",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      padding: "0.5rem 1rem",
                      gap: "0.5rem",
                      color: "#222",
                      position: "relative",
                      overflow: "hidden",
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
                        color: "#fff", // white text
                      }}
                    >
                      <Icon style={{ fontSize: "1.25em" }} />
                      {title}
                    </div>

                    {/* Description */}
                    <div
                      style={{
                        fontSize: "0.96rem",
                        color: "#fff", // white text
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

        {/* CTO Panel Section */}
        <div
          className="homepage-cto-panel"
          style={{
            width: "calc(100% - 4rem)",
            margin: "2rem auto 0 auto",
            background: "#0d3c47", // deep blue/dark turquoise
            borderRadius: "18px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
            padding: "2.5rem 2rem 2rem 2rem",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: "2.5rem",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: "0 0 120px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiStar
              style={{
                fontSize: "5.5rem",
                color: "#ffb347",
                filter:
                  "drop-shadow(0 0 12px #ffb347) drop-shadow(0 0 24px #fff7e6)",
                animation: "homepage-cto-star-pulse 1.2s infinite alternate",
              }}
              aria-label="CTO Star Icon"
            />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: "1.35rem",
                fontWeight: 700,
                letterSpacing: "0.01em",
                color: "#fff",
              }}
            >
              Our Purpose is Simple{" "}
              <span
                style={{
                  fontWeight: 400,
                  fontSize: "1.05rem",
                  color: "#19e6d9",
                  marginLeft: "0.5rem",
                }}
              >
                To help food and drink businesses keep their people safe
              </span>
            </h3>
            <blockquote
              style={{
                margin: "1.1rem 0 0 0",
                fontSize: "1.08rem",
                fontWeight: 400,
                lineHeight: 1.5,
                color: "#fff",
                borderLeft: "4px solid #19e6d9",
                paddingLeft: "1rem",
              }}
            >
              &quot;We built Naranja to help food and drink businesses keep
              their people safe and deliver the highest quality products to
              consumers. By taking care of compliance, training, and audit
              readiness, we free you to focus on what matters most — running
              your operation and making great products.&quot;
            </blockquote>
          </div>
        </div>

        {/* Add Log In button below main content */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
          <Link href="/homepage/login" legacyBehavior>
            <a className="neon-btn neon-btn-primary neon-btn-square">
              Log In
            </a>
          </Link>
        </div>

        {/* Add Raise an Issue button */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
          <a
            className="neon-btn neon-btn-primary neon-btn-square"
            href="/raise-issue"
          >
            Raise an issue
          </a>
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
            padding-left: 1rem !important;
          }
          .homepage-feature-card {
            transition:
              box-shadow 0.3s,
              filter 0.3s;
          }
          .homepage-feature-card::after,
          .homepage-feature-card::before,
          .homepage-feature-card-right {
            pointer-events: none;
            z-index: 2;
            transition:
              box-shadow 0.3s,
              filter 0.3s;
          }
          .homepage-feature-card::after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 4px;
            border-bottom-left-radius: 14px;
            border-bottom-right-radius: 14px;
          }
          .homepage-feature-card::before {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            height: 4px;
            border-top-left-radius: 14px;
            border-top-right-radius: 14px;
          }
          .homepage-feature-card-right {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            width: 4px;
            border-top-right-radius: 14px;
            border-bottom-right-radius: 14px;
            pointer-events: none;
            z-index: 2;
          }
          .homepage-feature-card-0::after,
          .homepage-feature-card-0::before {
            background: linear-gradient(
              90deg,
              #159ca3 0%,
              #159ca3 5%,
              #ffb347 100%
            );
          }
          .homepage-feature-card-1::after,
          .homepage-feature-card-1::before {
            background: linear-gradient(
              90deg,
              #159ca3 0%,
              #159ca3 5%,
              #19e6d9 100%
            );
          }
          .homepage-feature-card-2::after,
          .homepage-feature-card-2::before {
            background: linear-gradient(
              90deg,
              #159ca3 0%,
              #159ca3 5%,
              #4f8cff 100%
            );
          }
          .homepage-feature-card-3::after,
          .homepage-feature-card-3::before {
            background: linear-gradient(
              90deg,
              #159ca3 0%,
              #159ca3 5%,
              #ff5ad1 100%
            );
          }
          .homepage-feature-card-0 .homepage-feature-card-right {
            background: linear-gradient(
              180deg,
              #159ca3 0%,
              #159ca3 5%,
              #ffb347 100%
            );
          }
          .homepage-feature-card-1 .homepage-feature-card-right {
            background: linear-gradient(
              180deg,
              #159ca3 0%,
              #159ca3 5%,
              #19e6d9 100%
            );
          }
          .homepage-feature-card-2 .homepage-feature-card-right {
            background: linear-gradient(
              180deg,
              #159ca3 0%,
              #159ca3 5%,
              #4f8cff 100%
            );
          }
          .homepage-feature-card-3 .homepage-feature-card-right {
            background: linear-gradient(
              180deg,
              #159ca3 0%,
              #159ca3 5%,
              #ff5ad1 100%
            );
          }
          /* Subtle glow and pulse on hover - use border neon color for each card */
          .homepage-feature-card-0:hover {
            box-shadow: 0 0 8px 2px #ffb347;
            filter: brightness(1.03) drop-shadow(0 0 3px #ffb347);
            animation: homepage-feature-card-pulse-0 1.1s infinite alternate;
          }
          .homepage-feature-card-1:hover {
            box-shadow: 0 0 8px 2px #19e6d9;
            filter: brightness(1.03) drop-shadow(0 0 3px #19e6d9);
            animation: homepage-feature-card-pulse-1 1.1s infinite alternate;
          }
          .homepage-feature-card-2:hover {
            box-shadow: 0 0 8px 2px #4f8cff;
            filter: brightness(1.03) drop-shadow(0 0 3px #4f8cff);
            animation: homepage-feature-card-pulse-2 1.1s infinite alternate;
          }
          .homepage-feature-card-3:hover {
            box-shadow: 0 0 8px 2px #ff5ad1;
            filter: brightness(1.03) drop-shadow(0 0 3px #ff5ad1);
            animation: homepage-feature-card-pulse-3 1.1s infinite alternate;
          }
          .homepage-feature-card-0:hover::after,
          .homepage-feature-card-0:hover::before,
          .homepage-feature-card-0:hover .homepage-feature-card-right {
            box-shadow: 0 0 4px 1px #ffb347;
            filter: brightness(1.07);
          }
          .homepage-feature-card-1:hover::after,
          .homepage-feature-card-1:hover::before,
          .homepage-feature-card-1:hover .homepage-feature-card-right {
            box-shadow: 0 0 4px 1px #19e6d9;
            filter: brightness(1.07);
          }
          .homepage-feature-card-2:hover::after,
          .homepage-feature-card-2:hover::before,
          .homepage-feature-card-2:hover .homepage-feature-card-right {
            box-shadow: 0 0 4px 1px #4f8cff;
            filter: brightness(1.07);
          }
          .homepage-feature-card-3:hover::after,
          .homepage-feature-card-3:hover::before,
          .homepage-feature-card-3:hover .homepage-feature-card-right {
            box-shadow: 0 0 4px 1px #ff5ad1;
            filter: brightness(1.07);
          }
          @keyframes homepage-feature-card-pulse-0 {
            0% {
              box-shadow: 0 0 8px 2px #ffb347;
            }
            100% {
              box-shadow: 0 0 8px 4px #ffb347;
            }
          }
          @keyframes homepage-feature-card-pulse-1 {
            0% {
              box-shadow: 0 0 8px 2px #19e6d9;
            }
            100% {
              box-shadow: 0 0 8px 4px #19e6d9;
            }
          }
          @keyframes homepage-feature-card-pulse-2 {
            0% {
              box-shadow: 0 0 8px 2px #4f8cff;
            }
            100% {
              box-shadow: 0 0 8px 4px #4f8cff;
            }
          }
          @keyframes homepage-feature-card-pulse-3 {
            0% {
              box-shadow: 0 0 8px 2px #ff5ad1;
            }
            100% {
              box-shadow: 0 0 8px 4px #ff5ad1;
            }
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
    href: "/about/sops-policies",
  },
  {
    Icon: FiLayers,
    title: "Turkus",
    text: "Your single source of truth: versioned docs, linked to modules and roles.",
    href: "/about/turkus",
  },
  {
    Icon: FiAlertTriangle,
    title: "Risk Assessments",
    text: "Assign and track risk controls with evidence, sign-off, and reminders.",
    href: "/about/managing-risks",
  },
  {
    Icon: FiPlayCircle,
    title: "Instructional Media",
    text: "Embed videos and visuals straight into training to boost retention.",
    href: "/about/instructional-media",
  },
];
