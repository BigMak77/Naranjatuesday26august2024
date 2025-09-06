// app/dpa/page.tsx
import React from "react";
import DPA from "@/components/homepage/DPA";

export default function DpaPage() {
  return (
    <DPA
      lastUpdated="6 September 2025"
      controller={{
        legalName: "Customer Ltd",
        address: "1 Example Road, London SW1A 1AA, UK",
        country: "United Kingdom",
        contactEmail: "privacy@customer.example",
        role: "Controller",
      }}
      processor={{
        legalName: "Naranja Ltd",
        address: "123 Example Street, London SW1A 1AA, UK",
        country: "United Kingdom",
        contactEmail: "dpo@naranja.example",
        role: "Processor",
      }}
      governingLaw="England and Wales"
      supervisoryAuthority="the ICO (UK)"
      includeSCCsNote
      includeUKAddendumNote
      includeAuditClause
      includeLiabilityCap
      liabilityCapText="the aggregate fees paid by Controller to Naranja under the main agreement in the 12 months preceding the event"
      breachNotifyHours={72}
      dataDeletionDays={30}
      processing={[
        {
          categoryOfDataSubjects: "End users and customer personnel",
          categoriesOfPersonalData: "Name, email, IP address, device identifiers, usage logs, support communications",
          specialCategories: "None",
          purpose: "Provide, operate, secure, and improve the Naranja services; customer support",
          nature: "Hosting, storage, processing, analytics, support",
          retention: "For the subscription term and up to 90 days thereafter for backups/logs",
        },
      ]}
      securityMeasures={[
        { title: "Access Control", detail: "Role-based access, least privilege, SSO/MFA for internal systems." },
        { title: "Encryption", detail: "TLS in transit; AES-256 at rest for databases and backups." },
        { title: "Network Security", detail: "Segmentation, firewalls, WAF, continuous monitoring." },
        { title: "Secure SDLC", detail: "Code reviews, dependency scanning, CI/CD with signed artifacts." },
        { title: "Vulnerability Management", detail: "Regular scanning, patching SLAs, penetration tests." },
        { title: "Backup & DR", detail: "Automated backups, tested restores, geo-redundancy." },
        { title: "Logging & Monitoring", detail: "Centralised logs, alerting, anomaly detection." },
        { title: "Incident Response", detail: "Documented runbooks, on-call rotation, breach handling procedures." },
        { title: "Personnel", detail: "Background checks where lawful, confidentiality agreements, annual training." },
        { title: "Physical Security", detail: "Data centres with 24/7 security, access logs, CCTV (via cloud providers)." },
      ]}
      subProcessors={[
        { name: "CloudHost Co.", service: "Infrastructure hosting", location: "EU (Ireland)", safeguards: "In-EEA processing", website: "https://cloudhost.example" },
        { name: "MailBlaster", service: "Transactional email", location: "EEA/US", safeguards: "SCCs Module 3; UK Addendum", website: "https://mailblaster.example" },
        { name: "Metricsly", service: "Product analytics", location: "EU (Germany)", safeguards: "In-EEA processing", website: "https://metricsly.example" },
      ]}
    />
  );
}
