import React from "react";
import { FiPlus } from "react-icons/fi";
import NeonIconButton from "@/components/ui/NeonIconButton";

export default function TurkusAboutPage() {
  return (
    <main
      style={{
        padding: "2.5rem 1.5rem",
        maxWidth: 800,
        margin: "0 auto",
        color: "#0d3c47",
        fontFamily: "Geist, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          color: "#159ca3",
          marginBottom: "1.5rem",
        }}
      >
        About Turkus
      </h1>
      <section
        style={{
          background: "linear-gradient(90deg, #19e6d9 0%, #159ca3 100%)",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 2px 8px rgba(21,156,163,0.08)",
          color: "#fff",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          Our Mission
        </h2>
        <p style={{ fontSize: "1.15rem", lineHeight: 1.6 }}>
          Turkus is dedicated to empowering food and drink businesses with
          modern compliance, training, and audit solutions. We help you keep
          your people safe and your products top quality.
        </p>
      </section>
      <section style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontSize: "1.3rem",
            fontWeight: 600,
            color: "#159ca3",
            marginBottom: "0.75rem",
          }}
        >
          What We Offer
        </h2>
        <ul
          style={{
            fontSize: "1.08rem",
            lineHeight: 1.7,
            paddingLeft: "1.5rem",
          }}
        >
          <li>Centralized SOPs and policies</li>
          <li>Role-based training and acknowledgements</li>
          <li>Real-time dashboards and audit trails</li>
          <li>Easy evidence collection and compliance management</li>
        </ul>
      </section>
      <section>
        <h2
          style={{
            fontSize: "1.3rem",
            fontWeight: 600,
            color: "#159ca3",
            marginBottom: "0.75rem",
          }}
        >
          Contact
        </h2>
        <p style={{ fontSize: "1.08rem" }}>
          Email:{" "}
          <a
            href="mailto:info@turkus.app"
            style={{ color: "#19e6d9", textDecoration: "none" }}
          >
            info@turkus.app
          </a>
          <br />
          Address: 456 Blue Street, London, UK
        </p>
      </section>
      <NeonIconButton variant="add" icon={<FiPlus />} title="Add" />
    </main>
  );
}
