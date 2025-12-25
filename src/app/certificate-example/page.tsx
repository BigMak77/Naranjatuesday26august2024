"use client";

import React from "react";
import TrainingCertificate, { openCertificateWindow, CertificateData } from "@/components/training/TrainingCertificate";

export default function CertificateExamplePage() {
  const sampleData: CertificateData = {
    recipientName: "John Smith",
    moduleName: "Health & Safety Training",
    completedDate: new Date().toISOString(),
    employeeNumber: "EMP-12345",
    trainerName: "Jane Doe",
    organizationName: "Naranja Safety Systems"
  };

  const handleOpenCertificate = () => {
    openCertificateWindow(sampleData, true);
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px", fontSize: "32px", fontWeight: "bold" }}>
        Training Certificate Example
      </h1>

      <p style={{ marginBottom: "20px", color: "#666" }}>
        This page shows a preview of the training certificate and allows you to open it in a new window for printing.
      </p>

      <div style={{ marginBottom: "30px" }}>
        <button
          onClick={handleOpenCertificate}
          style={{
            padding: "12px 24px",
            backgroundColor: "#053639",
            color: "white",
            border: "1px solid #40e0d0",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: "pointer",
            fontWeight: "500",
            marginRight: "10px"
          }}
        >
          Open Certificate in New Window
        </button>

        <button
          onClick={() => openCertificateWindow(sampleData, false)}
          style={{
            padding: "12px 24px",
            backgroundColor: "#fa7a20",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: "pointer",
            fontWeight: "500"
          }}
        >
          Open Without Auto-Print
        </button>
      </div>

      <div style={{
        border: "2px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        backgroundColor: "#f9fafb"
      }}>
        <h2 style={{ marginBottom: "15px", fontSize: "20px", fontWeight: "600" }}>
          Certificate Preview
        </h2>
        <div style={{ transform: "scale(0.8)", transformOrigin: "top left" }}>
          <TrainingCertificate data={sampleData} />
        </div>
      </div>

      <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#f0f9ff", borderRadius: "8px" }}>
        <h3 style={{ marginBottom: "10px", fontSize: "18px", fontWeight: "600" }}>
          Sample Data Used:
        </h3>
        <pre style={{
          backgroundColor: "white",
          padding: "15px",
          borderRadius: "4px",
          overflow: "auto",
          fontSize: "14px"
        }}>
          {JSON.stringify(sampleData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
