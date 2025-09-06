// app/terms/page.tsx
import React from "react";
import TermsOfService from "@/components/homepage/TermsOfService";

export default function TermsPage() {
  return (
    <TermsOfService
      companyName="Naranja"
      productName="Naranja"
      lastUpdated="6 September 2025"
      governingLaw="England and Wales"
      venue="the courts of England and Wales"
      contact={{
        email: "legal@naranja.example",
        address: "123 Example Street, London, SW1A 1AA, United Kingdom",
      }}
      billing={{
        currency: "GBP",
        refunds: "prorated",
        trialDays: 14,
        autoRenew: true,
        noticeDaysBeforeRenewal: 30,
      }}
      hasFreeTier={true}
      includesBetaFeatures={true}
    />
  );
}
