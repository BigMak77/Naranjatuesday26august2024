"use client";

import Link from "next/link";
import Script from "next/script";
import {
  FiFileText,
  FiLayers,
  FiAlertTriangle,
  FiPlayCircle,
  FiStar,
  FiPlus,
} from "react-icons/fi";
import Image from "next/image";
import GlobalFooter from "@/components/GlobalFooter";
import NeonIconButton from "@/components/ui/NeonIconButton";

export default function HomePage() {
  return (
    <main className="homepage" aria-label="Homepage">
      {/* JSON-LD for better SEO */}
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
            background: "#fa7a20", // lighter orange
            borderRadius: "18px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            padding: "1rem",
            boxSizing: "border-box",
            overflow: "hidden",
            minHeight: "360px", // use minHeight instead of fixed height
            height: "auto", // let content determine height
          }}
        >
          {/* Cards row */}
          <div
            className="homepage-cards-row"
            style={{
              display: "grid",
              gridTemplateColumns: "400px 1fr", // reduce left card width
              height: "260px", // reduce row height
              minWidth: "700px",
              width: "100%",
              margin: "0 auto",
              position: "relative",
              alignItems: "stretch",
              gap: "1.5rem", // add gap between left and right cards
            }}
          >
            {/* Left card */}
            <div
              className="homepage-card-large"
              style={{
                minWidth: "400px",
                maxWidth: "400px",
                background: "#05363a", // base darker turquoise
                borderRadius: "14px",
                paddingLeft: "1.2rem",
                paddingTop: 0,
                paddingBottom: 0,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
                position: "relative",
                zIndex: 1,
                height: "260px",
                color: "#fff",
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
              {/* Add gap below header */}
              <div style={{ height: "0.5rem" }} />
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
              {/* Larger gap and a separator line between problem and solution */}
              <hr style={{ width: "90%", border: 0, borderTop: "2px solid #fff", opacity: 0.18, margin: "1.5rem 0 1.2rem 0" }} />
              <h2
                style={{
                  margin: "0 0 0 0",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiFileText style={{ fontSize: "1.25em" }} />
                Our solution
              </h2>
              {/* Add gap below header */}
              <div style={{ height: "0.5rem" }} />
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
                minWidth: "320px",
                display: "grid",
                gridTemplateRows: "repeat(4, 1fr)",
                gap: "0.5rem",
                alignItems: "stretch",
                position: "static", // remove relative positioning
                width: "100%",
                zIndex: 2,
                height: "260px",
                borderRadius: "14px",
                padding: "0.5rem 0.5rem 0.5rem 0.5rem",
              }}
            >
              {FEATURES.map(({ Icon, title, text, href }, i) => {
                return (
                  <Link
                    key={href || i}
                    href={href}
                    className={`homepage-feature-card homepage-feature-card-${i}`}
                    style={{
                      borderRadius: "14px",
                      textDecoration: "none",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      padding: "0.5rem 1rem",
                      gap: "0.5rem",
                      color: "#222",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "none",
                      border: "none", // Remove any border
                      background: "none", // Remove any background
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

          {/* Metrics boxes row - 4 boxes underneath cards row */}
          <div
            className="homepage-metrics-row"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1.2rem",
              marginTop: "1.5rem",
              marginBottom: "0.5rem",
              width: "100%",
              minWidth: "700px",
              alignItems: "stretch",
            }}
          >
            <div
              className="homepage-metric-box"
              style={{
                background: "#d6ffd6", // very light lime green for this box
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                padding: "1.1rem 1rem 1rem 1.2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                minHeight: "80px",
                border: "2.5px solid #4bb543", // darker lime green border
              }}
            >
              <span style={{ fontSize: "1.7rem", fontWeight: 700, color: "#4bb543" }}>98%</span>
              <span style={{ fontSize: "1.01rem", color: "#333", fontWeight: 500, marginTop: "0.2rem" }}>Training Completion</span>
            </div>
            <div
              className="homepage-metric-box"
              style={{
                background: "#82c8e5", // updated color for this box
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                padding: "1.1rem 1rem 1rem 1.2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                minHeight: "80px",
                border: "2.5px solid #2176ae", // darker blue border
              }}
            >
              <span style={{ fontSize: "1.7rem", fontWeight: 700, color: "#2176ae" }}>100%</span>
              <span style={{ fontSize: "1.01rem", color: "#333", fontWeight: 500, marginTop: "0.2rem" }}>Audit Readiness</span>
            </div>
            <div
              className="homepage-metric-box"
              style={{
                background: "#efb123", // updated color for this box
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                padding: "1.1rem 1rem 1rem 1.2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                minHeight: "80px",
                border: "2.5px solid #b34700", // add orange border to match 24/7
              }}
            >
              <span style={{ fontSize: "1.7rem", fontWeight: 700, color: "#b34700" }}>24/7</span>
              <span style={{ fontSize: "1.01rem", color: "#333", fontWeight: 500, marginTop: "0.2rem" }}>Access Anywhere</span>
            </div>
            <div
              className="homepage-metric-box"
              style={{
                background: "#cd5c5c", // updated color for this box
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                padding: "1.1rem 1rem 1rem 1.2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                minHeight: "80px",
                border: "2.5px solid #8b2323", // darker red border
              }}
            >
              <span style={{ fontSize: "1.7rem", fontWeight: 700, color: "#8b2323" }}>Zero</span>
              <span style={{ fontSize: "1.01rem", color: "#333", fontWeight: 500, marginTop: "0.2rem" }}>Lost Documents</span>
            </div>
          </div>
        </div>

        {/* CTO Panel Section */}
        <div
          className="homepage-cto-panel"
          style={{
            width: "calc(100% - 4rem)",
            margin: "2rem auto 0 auto",
            background: "#05363a", // updated to requested base color
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
                fontSize: "6.5rem", // reduced size
                minWidth: "100px",
                minHeight: "100px",
                maxWidth: "180px",
                maxHeight: "180px",
                color: "#ffb347",
                filter:
                  "drop-shadow(0 0 48px #fff7b2) drop-shadow(0 0 32px #ffb347) drop-shadow(0 0 18px #fff7e6)", // strong yellow glow
                animation: "homepage-cto-star-pulse 1.2s infinite alternate",
                transition: "filter 0.3s, font-size 0.3s",
                zIndex: 20,
                position: "relative",
                background: "none",
                boxShadow: "none",
                pointerEvents: "auto",
                display: "block",
                margin: "0 auto",
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

        <NeonIconButton variant="add" icon={<FiPlus />} title="Add" />

        <GlobalFooter />

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
          /* Remove hover pulse and color effects */
          .homepage-feature-card-0:hover,
          .homepage-feature-card-1:hover,
          .homepage-feature-card-2:hover,
          .homepage-feature-card-3:hover,
          .homepage-feature-card-0:hover::after,
          .homepage-feature-card-0:hover::before,
          .homepage-feature-card-0:hover .homepage-feature-card-right,
          .homepage-feature-card-1:hover::after,
          .homepage-feature-card-1:hover::before,
          .homepage-feature-card-1:hover .homepage-feature-card-right,
          .homepage-feature-card-2:hover::after,
          .homepage-feature-card-2:hover::before,
          .homepage-feature-card-2:hover .homepage-feature-card-right,
          .homepage-feature-card-3:hover::after,
          .homepage-feature-card-3:hover::before,
          .homepage-feature-card-3:hover .homepage-feature-card-right {
            box-shadow: none !important;
            filter: none !important;
            animation: none !important;
          }
          @keyframes homepage-feature-card-pulse-0 {}
          @keyframes homepage-feature-card-pulse-1 {}
          @keyframes homepage-feature-card-pulse-2 {}
          @keyframes homepage-feature-card-pulse-3 {}
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
    title: "Risk Assessments",
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
