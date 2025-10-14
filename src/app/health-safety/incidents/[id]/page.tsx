import React from "react";
import NeonPanel from "@/components/NeonPanel";
import { FiAlertCircle } from "react-icons/fi";

export default function IncidentDetailPage() {
  // In a real app, you'd fetch the incident by ID from the router/query params and supabase
  // For now, show a placeholder
  return (
    <NeonPanel className="incident-detail-panel">
      <h1 className="incident-detail-title">
        <FiAlertCircle className="incident-detail-title-icon" />
      </h1>
      <div className="incident-detail-content">
        <h2 className="incident-detail-heading">Incident Details</h2>
        <p className="incident-detail-info">
          This page will show details for the selected incident. (Wire up data
          fetch by ID as needed.)
        </p>
      </div>
    </NeonPanel>
  );
}
