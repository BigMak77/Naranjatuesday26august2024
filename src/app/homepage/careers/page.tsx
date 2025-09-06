// app/careers/page.tsx
import React from "react";
import CareersPage from "@/components/homepage/CareersPage";

const roles = [
  {
    id: "fe-001",
    title: "Frontend Engineer",
    department: "Engineering",
    location: "London, UK",
    commitment: "Full-time" as const,
    remote: true,
    salaryRange: "£60–75k + equity",
    postedAt: "6 September 2025",
    description: "Own end-to-end UI for our core web product with a modern React stack.",
    responsibilities: [
      "Build accessible, high-performance UIs in React.",
      "Collaborate with design/product to ship iteratively.",
      "Improve DX and component libraries."
    ],
    requirements: [
      "3+ years in React/TypeScript.",
      "Strong CSS and UI systems experience.",
      "Accessibility and performance mindset."
    ],
    applyUrl: "https://jobs.example.com/frontend-engineer"
  },
  {
    id: "pm-002",
    title: "Product Manager",
    department: "Product",
    location: "Remote (UK/EU)",
    commitment: "Full-time" as const,
    remote: true,
    postedAt: "2 September 2025",
    description: "Lead discovery and delivery for a cross-functional squad.",
    responsibilities: ["Own roadmap and prioritisation.", "Write crisp specs.", "Ship outcomes, not output."],
    requirements: ["3+ years in product roles.", "Data-informed decision making.", "Strong stakeholder comms."]
  },
  {
    id: "cs-003",
    title: "Customer Success Manager",
    department: "Go-to-Market",
    location: "Manchester, UK",
    commitment: "Full-time" as const,
    remote: false,
    description: "Partner with customers to deliver value and retention."
  }
];

export default function Careers() {
  return (
    <CareersPage
      companyName="Naranja"
      heroTitle="Come build with Naranja"
      heroSubtitle="We’re a small, sharp team shipping fast — and we’re hiring."
      roles={roles}
      orgUrl="https://naranja.example"
      orgLogoUrl="/logo.png"
      orgAddress="123 Example Street, London, SW1A 1AA, UK"
      enableJobSchema
      globalApplyCta={{ label: "Send an open application", url: "mailto:careers@naranja.example?subject=Open Application" }}
      contactEmail="careers@naranja.example"
    />
  );
}
