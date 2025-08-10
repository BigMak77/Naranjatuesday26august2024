"use client";

import Link from "next/link";
import Image from "next/image";
import {
  FiFileText,
  FiLayers,
  FiAlertTriangle,
  FiPlayCircle,
  FiShield,
  FiTrendingUp,
  FiCheckCircle,
  FiArrowRight,
  FiMail,
} from "react-icons/fi";
import NeonFeatureCard from "@/components/NeonFeatureCard";

export default function HomePage() {
  return (
    <main className="homepage">
      {/* Header (sticky) */}
      <header className="site-header">
        <div className="container header-inner">
          {/* Remove logo from here, handled globally in layout */}
          <nav className="nav">
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/features" className="nav-link">Features</Link>
            <Link href="/contact-us" className="btn-neon btn-small">
              <FiMail /> <span>Talk to Us</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO — scrolling background */}
      <section className="hero">
        <div className="hero-bg">
          <Image
            src="/background1.jpg"
            alt="Food manufacturing"
            fill
            priority
            sizes="100%"
            className="hero-bg-img"
          />
          <div className="hero-overlay-cyan" />
          <div className="hero-overlay-gradient" />
        </div>

        <div className="container hero-inner">
          <div className="hero-copy">
            <h1 className="hero-title">
              Training & Compliance, Built for Food Manufacturing
            </h1>
            <p className="hero-subtitle">
              Streamline SOPs, policies, risk assessments and training — beautifully simple, deeply auditable, and ready to scale.
            </p>

            <div className="hero-actions">
              <Link href="/contact-us" className="btn-accent">
                <span>Book a Demo</span> <FiArrowRight />
              </Link>
              <Link href="/features" className="btn-ghost">
                Explore Features
              </Link>
            </div>

            <div className="hero-badges">
              <Badge icon={<FiTrendingUp />} text="Reduce audit prep by 60%" color="cyan" />
              <Badge icon={<FiCheckCircle />} text="ISO & BRCGS alignment" color="orange" />
              <Badge icon={<FiShield />} text="Granular version control" color="pink" />
            </div>
          </div>

          {/* Highlight panel */}
          <div className="hero-panel">
            <FeatureRow icon={<FiFileText />} title="SOPs & Policies" text="Create, version, assign, and track acknowledgement with full audit history." />
            <FeatureRow icon={<FiLayers />} title="SmartDoc" text="Controlled documents linked to modules and roles — your single source of truth." />
            <FeatureRow icon={<FiAlertTriangle />} title="Risk Assessments" text="Assign, complete, and monitor risk controls with evidence and sign‑off." />
            <FeatureRow icon={<FiPlayCircle />} title="Instructional Media" text="Embed video and visuals so training is clear, visual, and memorable." />
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="trusted">
        <div className="container">
          <p className="trusted-title">Trusted by teams who care about safety & quality</p>
          <div className="trusted-logos">
            {["brand1.png", "brand2.png", "brand3.png", "brand4.png", "brand5.png"].map((src) => (
              <div className="trusted-logo" key={src}>
                <Image
                  src={`/${src}`}
                  alt="Partner logo"
                  fill
                  sizes="160px"
                  className="trusted-img"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid (reuse your NeonFeatureCard) */}
      <section className="features">
        <div className="container grid">
          {FEATURES.map(({ Icon, title, text, href }, idx) => {
            const themes = ["neon-feature-orange","neon-feature-turquoise","neon-feature-blue","neon-feature-pink"];
            return (
              <NeonFeatureCard
                key={title}
                icon={<Icon size={22} />}
                title={title}
                text={text}
                href={href}
                className={themes[idx % themes.length]}
              >
                <p>{text}</p>
                <Link href={href} className="neon-link">
                  Learn More <FiArrowRight size={16} />
                </Link>
              </NeonFeatureCard>
            );
          })}
        </div>
      </section>

  

      {/* CTA Banner */}
      <section className="cta">
        <div className="container cta-inner">
          <div>
            <h3>Ready to transform your compliance process?</h3>
            <p>Bring your team together with clear, role‑specific training that actually gets used.</p>
          </div>
          <div className="cta-actions">
            <Link href="/contact-us" className="btn-dark">
              <FiMail /> <span>Get in touch</span>
            </Link>
            <Link href="/about" className="btn-outline">
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* Page styles (uses your global neon palette; no fixed background, no fixed footer) */}
      <style jsx>{`
        .container { width: min(1200px, 92vw); margin: 0 auto; }

        .site-header {
          position: sticky; top: 0; z-index: 20;
          border-bottom: 4px solid #ffa500;
          background: linear-gradient(90deg, rgba(11,58,58,0.96), rgba(1,31,36,0.96));
          backdrop-filter: saturate(160%) blur(6px);
        }
        .header-inner {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 0;
        }
        .logo-wrap { position: relative; width: auto; height: 48px; }
        .logo-img {
          object-fit: contain;
          filter: brightness(1.1);
          max-height: 180px;
          width: auto !important;
          max-width: auto;
          position: relative !important;
          left: 0;
          right: unset;
          margin: 0;
          display: block;
        }
        .nav { display: flex; gap: 1rem; align-items: center; }
        .nav-link { color: #fff; opacity: .9; text-decoration: none; font-weight: 600; }
        .nav-link:hover { opacity: 1; text-decoration: underline; }

        .hero { position: relative; }
        .hero-bg { position: absolute; inset: 0; }
        .hero-bg-img { object-fit: cover; object-position: center top; filter: brightness(.78); }
        .hero-overlay-cyan { position: absolute; inset: 0; background: radial-gradient(60% 60% at 20% 10%, rgba(0,255,255,.18), rgba(0,0,0,0)); }
        .hero-overlay-gradient { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(1,59,59,.18) 0%, rgba(1,31,36,.72) 60%, rgba(1,31,36,.95) 100%); }

        .hero-inner {
          position: relative; z-index: 1;
          min-height: 72vh; display: grid; grid-template-columns: 1.1fr .9fr; gap: 2rem;
          align-items: center; padding: 5rem 0 3rem;
        }
        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr; padding: 4rem 0 2rem; }
        }

        .hero-title {
          font-size: clamp(2.2rem, 3.5vw + 1rem, 3.5rem);
          font-weight: 900; color: #ffa500;
          text-shadow: 0 0 18px rgba(255,165,0,.25); margin-bottom: .75rem;
        }
        .hero-subtitle {
          font-size: clamp(1rem, 1.1vw + .6rem, 1.35rem);
          color: #e6fdff; opacity: .95; margin-bottom: 1.25rem;
        }
        .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
        .btn-accent {
          display: inline-flex; align-items: center; gap: .5rem;
          background: #ffa500; color: #102c2f; font-weight: 800;
          padding: .85rem 1.2rem; border-radius: .75rem; box-shadow: 0 0 20px rgba(255,165,0,.35);
        }
        .btn-accent:hover { background: #ffb23a; box-shadow: 0 0 24px rgba(255,165,0,.5); }
        .btn-ghost {
          display: inline-flex; align-items: center; justify-content: center;
          padding: .85rem 1.2rem; border-radius: .75rem;
          border: 2px solid rgba(0,229,255,.5); color: #00e5ff; font-weight: 700;
        }
        .btn-ghost:hover { border-color: #00e5ff; box-shadow: 0 0 16px rgba(0,229,255,.25); }

        .hero-badges { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: 1.25rem; }

        .hero-panel {
          background: linear-gradient(180deg, rgba(0,229,255,.08), rgba(255,165,0,.06));
          border: 1px solid rgba(255,255,255,.08);
          box-shadow: 0 0 24px rgba(0,229,255,.22), inset 0 0 24px rgba(255,165,0,.08);
          backdrop-filter: blur(8px);
          border-radius: 1rem; padding: 1.25rem;
        }
        .feature-row { display: grid; grid-template-columns: 28px 1fr; gap: .75rem; align-items: flex-start; }
        .feature-row + .feature-row { border-top: 1px solid rgba(255,255,255,.08); padding-top: .75rem; margin-top: .75rem; }
        .feature-icon { font-size: 24px; color: #00e5ff; margin-top: 2px; }
        .feature-title { font-weight: 800; margin-bottom: .25rem; }
        .feature-text { color: rgba(255,255,255,.85); }

        .trusted { padding: 2.5rem 0; }
        .trusted-title { letter-spacing: 2px; opacity: .8; text-transform: uppercase; font-size: .85rem; }
        .trusted-logos { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.5rem; margin-top: .75rem; align-items: center; }
        @media (max-width: 900px) { .trusted-logos { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px) { .trusted-logos { grid-template-columns: repeat(2, 1fr); } }
        .trusted-logo { position: relative; width: 100%; height: 36px; opacity: .7; }
        .trusted-img { object-fit: contain; filter: grayscale(1) contrast(1.1); }

        .features { padding: 3rem 0; border-top: 1px solid rgba(255,255,255,.06); border-bottom: 1px solid rgba(255,255,255,.06);
          background: linear-gradient(180deg, rgba(0,229,255,.06), rgba(1,31,36,0)); }
        .grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 1000px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }

        .testimonials { padding: 3rem 0; }
        .testimonials-grid { display: grid; gap: 1.25rem; grid-template-columns: 1fr 1fr; }
        @media (max-width: 900px) { .testimonials-grid { grid-template-columns: 1fr; } }
        .testimonial {
          display: grid; grid-template-columns: 48px 1fr; gap: .75rem;
          background: linear-gradient(180deg, rgba(255,165,0,.06), rgba(0,229,255,.06));
          border: 1px solid rgba(255,255,255,.08); border-radius: 1rem; padding: 1rem;
          box-shadow: 0 0 18px rgba(255,165,0,.18);
        }
        .avatar-wrap { position: relative; width: 48px; height: 48px; border-radius: 999px; overflow: hidden; }
        .avatar-img { object-fit: cover; }
        .testimonial-body h4 { margin: 0 0 .1rem 0; font-weight: 800; }
        .role { opacity: .8; margin: 0 0 .4rem 0; }
        .quote { color: rgba(255,255,255,.9); margin: 0; }

        .cta {
          padding: 3rem 0;
          background: linear-gradient(45deg, rgba(255,94,98,.9), rgba(255,165,0,.9));
          box-shadow: 0 0 28px rgba(255,94,98,.3), inset 0 0 36px rgba(255,165,0,.24);
        }
        .cta-inner { display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center; }
        @media (max-width: 900px) { .cta-inner { grid-template-columns: 1fr; } }
        .cta h3 { margin: 0 0 .25rem 0; color: #fff; font-weight: 900; }
        .cta p { margin: 0; color: #fff; opacity: .95; }
        .cta-actions { display: flex; gap: .75rem; justify-content: flex-end; flex-wrap: wrap; }
        .btn-dark {
          display: inline-flex; align-items: center; gap: .5rem;
          background: #001b1f; color: #fff; font-weight: 800;
          padding: .85rem 1.2rem; border-radius: .75rem;
        }
        .btn-dark:hover { background: #02272c; }
        .btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          padding: .85rem 1.2rem; border-radius: .75rem;
          border: 2px solid rgba(255,255,255,.85); color: #fff; font-weight: 700;
        }

        /* Badges */
        .badge {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .4rem .7rem; border-radius: 999px; font-weight: 700; font-size: .9rem;
          border: 1px solid; box-shadow: 0 0 12px;
        }
        .badge-cyan { color: #0ff; border-color: rgba(0,255,255,.35); background: rgba(0,255,255,.08); box-shadow: 0 0 12px rgba(0,255,255,.22); }
        .badge-orange { color: #ffa500; border-color: rgba(255,165,0,.35); background: rgba(255,165,0,.10); box-shadow: 0 0 12px rgba(255,165,0,.22); }
        .badge-pink { color: #ff7bd5; border-color: rgba(255,123,213,.35); background: rgba(255,123,213,.10); box-shadow: 0 0 12px rgba(255,123,213,.22); }
      `}</style>
    </main>
  );
}

/* ---------- Small helpers ---------- */
function Badge({ icon, text, color }: { icon: React.ReactNode; text: string; color: "cyan" | "orange" | "pink"; }) {
  return (
    <span className={`badge badge-${color}`}>
      <i style={{ display: "inline-flex", fontSize: 18, lineHeight: 0 }}>{icon}</i>
      {text}
    </span>
  );
}

function FeatureRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string; }) {
  return (
    <div className="feature-row">
      <div className="feature-icon">{icon}</div>
      <div>
        <div className="feature-title">{title}</div>
        <div className="feature-text">{text}</div>
      </div>
    </div>
  );
}

/* ---------- Content ---------- */
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
    text: "Assign and track risk controls with evidence, sign‑off, and reminders.",
    href: "/managing-risks",
  },
  {
    Icon: FiPlayCircle,
    title: "Instructional Media",
    text: "Embed videos and visuals straight into training to boost retention.",
    href: "/instructional-media",
  },

];
