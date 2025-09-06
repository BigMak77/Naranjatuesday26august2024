import React from "react";

type CookieItem = {
  name: string;
  provider: string;          // e.g., "Naranja", "Google Analytics"
  purpose: string;
  type: "http" | "html_local_storage" | "html_session_storage" | "pixel";
  expires: string;           // e.g., "Session", "24 months"
  category: "necessary" | "preferences" | "analytics" | "marketing";
};

type CookiePolicyProps = {
  companyName?: string;
  lastUpdated?: string;
  contactEmail: string;
  categoriesIntro?: Partial<Record<CookieItem["category"], string>>;
  cookies: CookieItem[];
};

const CookiePolicy: React.FC<CookiePolicyProps> = ({
  companyName = "Naranja",
  lastUpdated = "6 September 2025",
  contactEmail,
  categoriesIntro = {
    necessary:
      "Required to provide the site and core features (security, auth, load-balancing). Cannot be switched off.",
    preferences:
      "Remember choices (e.g., language, region) to improve your experience.",
    analytics:
      "Help us understand site usage so we can improve performance and features.",
    marketing:
      "Used to show relevant content/ads across websites and measure effectiveness.",
  },
  cookies,
}) => {
  const grouped = cookies.reduce<Record<string, CookieItem[]>>((acc, c) => {
    (acc[c.category] ||= []).push(c);
    return acc;
  }, {});

  return (
    <article className="cookie" aria-labelledby="cookie-title">
      <h1 id="cookie-title">Cookie Policy</h1>
      <p className="meta">Last updated: {lastUpdated}</p>

      <p className="lead">
        This Cookie Policy explains how <strong>{companyName}</strong> uses cookies and similar
        technologies on our websites and apps. For how we process personal data, see our Privacy Notice.
      </p>

      <nav aria-label="Contents" className="toc">
        <h2>Contents</h2>
        <ol>
          <li><a href="#what">What are cookies?</a></li>
          <li><a href="#how">How we use them</a></li>
          <li><a href="#manage">How to manage preferences</a></li>
          <li><a href="#table">Cookies we use</a></li>
          <li><a href="#contact">Contact</a></li>
        </ol>
      </nav>

      <section id="what">
        <h2>1) What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device. We also use similar technologies like
          local storage and pixels. They allow the site to function, remember your preferences, and
          understand how the service is used.
        </p>
      </section>

      <section id="how">
        <h2>2) How we use them</h2>
        <ul>
          <li><strong>Strictly necessary</strong> — site operation, security, authentication.</li>
          <li><strong>Preferences</strong> — remember choices such as language and region.</li>
          <li><strong>Analytics</strong> — measure usage to improve performance and features.</li>
          <li><strong>Marketing</strong> — personalise content/ads and measure effectiveness.</li>
        </ul>
      </section>

      <section id="manage">
        <h2>3) How to manage preferences</h2>
        <p>
          You can manage non-essential cookies via our on-site controls (see “Cookie settings” in the footer)
          and through your browser settings. Blocking some cookies may impact site functionality.
        </p>
      </section>

      <section id="table">
        <h2>4) Cookies we use</h2>

        {(["necessary","preferences","analytics","marketing"] as const).map((cat) => (
          <div key={cat}>
            <h3 style={{ textTransform: "capitalize" }}>{cat}</h3>
            <p className="muted">{categoriesIntro[cat]}</p>
            {grouped[cat]?.length ? (
              <div className="table-wrap">
                <table className="table" aria-label={`${cat} cookies`}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Provider</th>
                      <th>Purpose</th>
                      <th>Type</th>
                      <th>Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[cat].map((ck, i) => (
                      <tr key={`${cat}-${i}`}>
                        <td><code>{ck.name}</code></td>
                        <td>{ck.provider}</td>
                        <td>{ck.purpose}</td>
                        <td>{ck.type.replace(/_/g, " ")}</td>
                        <td>{ck.expires}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">None currently in use for this category.</p>
            )}
          </div>
        ))}
      </section>

      <section id="contact">
        <h2>5) Contact</h2>
        <p>
          Questions about this Cookie Policy? Email us at{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </section>

      <style>{`
        .cookie { max-width: 900px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #0b1f24; background: #fff; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.05); }
        .meta { margin-top: -4px; color: #46636a; font-size: .95rem; }
        .lead { margin-top: 16px; }
        h1 { margin: 0; font-size: 2rem; }
        h2 { margin-top: 28px; font-size: 1.25rem; }
        .toc { background: #f6fbfc; border: 1px solid #d4eef0; padding: 16px; border-radius: 10px; margin: 20px 0; }
        .toc h2 { margin-top: 0; font-size: 1rem; text-transform: uppercase; letter-spacing: .04em; color: #2a5b62; }
        .toc ol { margin: 0; padding-left: 1.1rem; }
        .muted { color: #46636a; }
        .table-wrap { overflow-x: auto; }
        .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .table th, .table td { border: 1px solid #e6eef0; padding: 10px; text-align: left; vertical-align: top; }
        .table th { background: #f8fbfc; }
        code { background: #f3f6f7; padding: 2px 6px; border-radius: 6px; }
        @media print { .cookie { box-shadow: none; border-radius: 0; } }
      `}</style>
    </article>
  );
};

export default CookiePolicy;
