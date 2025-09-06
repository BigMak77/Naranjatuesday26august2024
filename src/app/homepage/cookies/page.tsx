// app/cookies/page.tsx
import React from "react";
import CookiePolicy from "@/components/homepage/CookiePolicy";

export default function CookiesPage() {
  return (
    <CookiePolicy
      companyName="Naranja"
      lastUpdated="6 September 2025"
      contactEmail="privacy@naranja.example"
      cookies={[
        {
          name: "naranja_session",
          provider: "Naranja",
          purpose: "Authenticate user sessions and maintain secure login.",
          type: "http",
          expires: "Session",
          category: "necessary",
        },
        {
          name: "naranja_consents",
          provider: "Naranja",
          purpose: "Stores user cookie preferences.",
          type: "html_local_storage",
          expires: "12 months",
          category: "necessary",
        },
        {
          name: "_ga",
          provider: "Google Analytics",
          purpose: "Analytics on site usage to improve features.",
          type: "http",
          expires: "24 months",
          category: "analytics",
        },
        {
          name: "_gid",
          provider: "Google Analytics",
          purpose: "Distinguish users for analytics.",
          type: "http",
          expires: "24 hours",
          category: "analytics",
        },
        {
          name: "_gcl_au",
          provider: "Google",
          purpose: "Ad conversion measurement.",
          type: "http",
          expires: "90 days",
          category: "marketing",
        },
      ]}
    />
  );
}
