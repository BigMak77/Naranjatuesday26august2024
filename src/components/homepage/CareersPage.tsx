"use client";
import React, { useMemo, useState } from "react";

type Role = {
  id: string;
  title: string;
  department: string;
  location: string; // e.g., "London, UK", "Remote (UK/EU)"
  commitment: "Full-time" | "Part-time" | "Contract" | "Internship";
  description?: string; // short teaser
  responsibilities?: string[];
  requirements?: string[];
  salaryRange?: string; // e.g., "£60–75k + equity"
  remote?: boolean;
  applyUrl?: string; // link to ATS or email mailto:
  postedAt?: string; // ISO or human date
};

type CareersPageProps = {
  companyName?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  values?: { title: string; text: string }[];
  benefits?: { title: string; text: string }[];
  roles: Role[];
  orgAddress?: string; // for schema
  orgUrl?: string; // for schema
  orgLogoUrl?: string; // for schema
  enableJobSchema?: boolean; // JSON-LD JobPosting
  globalApplyCta?: { label: string; url: string };
  contactEmail?: string; // fallback for mailto applications
};

const CareersPage: React.FC<CareersPageProps> = ({
  companyName = "Naranja",
  heroTitle = "Build the future with Naranja",
  heroSubtitle = "Join our team to create delightful products with real-world impact.",
  values = [
    { title: "Customer First", text: "We obsess over outcomes, not outputs." },
    { title: "Ship & Improve", text: "We deliver value fast and iterate with data." },
    { title: "Own It", text: "High trust, high autonomy, clear accountability." },
  ],
  benefits = [
    { title: "Flexible work", text: "Hybrid & remote options across UK/EU." },
    { title: "Time to recharge", text: "25+ days annual leave, plus paid wellness days." },
    { title: "Growth budget", text: "Annual stipend for learning and conferences." },
    { title: "Health & wellbeing", text: "Private healthcare and mental health support." },
    { title: "Ownership", text: "Competitive salary with equity options." },
  ],
  roles,
  orgAddress,
  orgUrl,
  orgLogoUrl,
  enableJobSchema = true,
  globalApplyCta,
  contactEmail = "careers@naranja.example",
}) => {
  // ----- Filters -----
  const departments = useMemo(
    () => Array.from(new Set(roles.map((r) => r.department))).sort(),
    [roles]
  );
  const locations = useMemo(
    () => Array.from(new Set(roles.map((r) => r.location))).sort(),
    [roles]
  );
  const commitments = ["Full-time", "Part-time", "Contract", "Internship"] as const;

  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("All");
  const [loc, setLoc] = useState<string>("All");
  const [commit, setCommit] = useState<string>("All");

  const filtered = roles.filter((r) => {
    const matchesQ =
      !q ||
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(q.toLowerCase()) ||
      (r.requirements || []).join(" ").toLowerCase().includes(q.toLowerCase()) ||
      (r.responsibilities || []).join(" ").toLowerCase().includes(q.toLowerCase());
    const matchesDept = dept === "All" || r.department === dept;
    const matchesLoc = loc === "All" || r.location === loc;
    const matchesCommit = commit === "All" || r.commitment === commit;
    return matchesQ && matchesDept && matchesLoc && matchesCommit;
  });

  // ----- JSON-LD (JobPosting) -----
  const jobSchema = enableJobSchema
    ? filtered.slice(0, 20).map((r) => ({
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: r.title,
        description:
          (r.description || "") +
          (r.responsibilities?.length
            ? `<ul>${r.responsibilities.map((li) => `<li>${li}</li>`).join("")}</ul>`
            : "") +
          (r.requirements?.length
            ? `<p><strong>Requirements</strong></p><ul>${r.requirements
                .map((li) => `<li>${li}</li>`)
                .join("")}</ul>`
            : ""),
        datePosted: r.postedAt || undefined,
        employmentType: r.commitment.replace("-", ""),
        hiringOrganization: {
          "@type": "Organization",
          name: companyName,
          sameAs: orgUrl,
          logo: orgLogoUrl,
        },
        jobLocationType: r.remote ? "TELECOMMUTE" : undefined,
        jobLocation: r.remote
          ? undefined
          : {
              "@type": "Place",
              address: {
                "@type": "PostalAddress",
                streetAddress: orgAddress || "",
                addressLocality: r.location, // consider city-only if you want stricter schema
                addressCountry: r.location.split(",").slice(-1)[0]?.trim() || "UK",
              },
            },
        applicantLocationRequirements: r.remote
          ? { "@type": "Country", name: "UK/EU" }
          : undefined,
        baseSalary: r.salaryRange
          ? {
              "@type": "MonetaryAmount",
              currency: "GBP",
              value: { "@type": "QuantitativeValue", value: undefined }, // range shown in text
            }
          : undefined,
        validThrough: undefined, // add a closing date if you have one
      }))
    : [];

  return (
    <main className="careers" aria-labelledby="careers-title">
      <header className="hero">
        <h1 id="careers-title">{heroTitle}</h1>
        <p className="sub">{heroSubtitle}</p>
        {globalApplyCta && (
          <p className="cta">
            <a className="btn" href={globalApplyCta.url}>
              {globalApplyCta.label}
            </a>
          </p>
        )}
      </header>

      <section className="values" aria-labelledby="values-title">
        <h2 id="values-title">Our values</h2>
        <div className="grid">
          {values.map((v) => (
            <article key={v.title} className="card">
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="benefits" aria-labelledby="benefits-title">
        <h2 id="benefits-title">Benefits</h2>
        <div className="grid">
          {benefits.map((b) => (
            <article key={b.title} className="card">
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="open-roles" aria-labelledby="roles-title">
        <div className="roles-header">
          <h2 id="roles-title">Open roles</h2>
        <div className="filters" role="search">
            <input
              aria-label="Search roles"
              placeholder="Search roles (e.g., frontend, data)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              aria-label="Filter by department"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            >
              <option>All</option>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select
              aria-label="Filter by location"
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
            >
              <option>All</option>
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <select
              aria-label="Filter by commitment"
              value={commit}
              onChange={(e) => setCommit(e.target.value)}
            >
              <option>All</option>
              {commitments.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="muted">
            No roles match your filters. Try clearing them or check back soon.
          </p>
        ) : (
          <ul className="role-list">
            {filtered.map((r) => (
              <li key={r.id} className="role">
                <div className="role-head">
                  <div>
                    <h3 className="role-title">{r.title}</h3>
                    <p className="role-meta">
                      <span>{r.department}</span> • <span>{r.location}</span> •{" "}
                      <span>{r.commitment}</span>
                      {r.salaryRange ? (
                        <>
                          {" "}
                          • <span>{r.salaryRange}</span>
                        </>
                      ) : null}
                      {r.postedAt ? (
                        <>
                          {" "}
                          • <span>Posted {r.postedAt}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="role-cta">
                    <a
                      className="btn"
                      href={
                        r.applyUrl ||
                        `mailto:${contactEmail}?subject=Application: ${encodeURIComponent(
                          r.title
                        )}`
                      }
                    >
                      Apply
                    </a>
                  </div>
                </div>
                {r.description && <p className="role-desc">{r.description}</p>}
                {(r.responsibilities?.length || r.requirements?.length) && (
                  <details>
                    <summary>Details</summary>
                    {r.responsibilities?.length ? (
                      <>
                        <h4>Responsibilities</h4>
                        <ul className="bullets">
                          {r.responsibilities.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {r.requirements?.length ? (
                      <>
                        <h4>Requirements</h4>
                        <ul className="bullets">
                          {r.requirements.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="inclusion" aria-labelledby="inclusion-title">
        <h2 id="inclusion-title">Diversity, equity & inclusion</h2>
        <p className="muted">
          We’re an equal opportunity employer. We welcome applicants from all
          backgrounds and identities. If you need reasonable adjustments during
          the hiring process, email us at{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </section>

      <section className="process" aria-labelledby="process-title">
        <h2 id="process-title">Our hiring process</h2>
        <ol className="timeline">
          <li>
            <strong>1. Apply</strong> — share your CV/portfolio or LinkedIn.
          </li>
          <li>
            <strong>2. Intro call</strong> — 20–30 min with Talent/Manager.
          </li>
          <li>
            <strong>3. Skills deep-dive</strong> — technical/role interview.
          </li>
          <li>
            <strong>4. Practical exercise</strong> — time-boxed & paid where
            applicable.
          </li>
          <li>
            <strong>5. Team fit</strong> — meet future teammates and ask
            questions.
          </li>
          <li>
            <strong>6. Offer</strong> — we align on start date, compensation &
            onboarding.
          </li>
        </ol>
      </section>

      {/* JSON-LD (robust @graph form: avoids touching per-item @context) */}
      {enableJobSchema && jobSchema.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": jobSchema.filter(Boolean),
            }),
          }}
        />
      )}
    </main>
  );
};

export default CareersPage;
