// app/privacy/page.tsx (Next.js App Router)
import React from "react";
import PrivacyNotice from "@/components/homepage/PrivacyNotice";

export default function PrivacyPage() {
  return (
    <PrivacyNotice
      companyName="Naranja"
      lastUpdated="6 September 2025"
      contact={{
        email: "privacy@naranja.example",
        address: "123 Example Street, London, SW1A 1AA, United Kingdom",
        phone: "+44 20 7946 0000",
        dpoEmail: "dpo@naranja.example",
      }}
      cookiePolicyUrl="/cookie-policy"
      showChildrenSection={false}
      showInternationalTransfers={true}
      processorsSummary="cloud hosting, analytics, email delivery, and payment processing"
      lawfulBases={["consent", "contract", "legal_obligation", "legitimate_interests"]}
    />
  );
}
