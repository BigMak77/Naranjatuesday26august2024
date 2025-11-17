"use client";

import React, { useState, useEffect } from "react";
// Removed unused NeonFeatureCard import
import RiskAssessmentManager from "@/components/healthsafety/RiskAssessmentManager";
import {
  FiClipboard,
  FiAlertCircle,
  FiFileText,
  FiHeart,
  FiTool,
} from "react-icons/fi";
import NeonForm from "@/components/NeonForm";
import NeonPanel from "@/components/NeonPanel";
import FolderTabs from "@/components/FolderTabs";
import HealthSafetyPolicyManager from "@/components/healthsafety/HealthSafetyPolicyManager";
// If the file is named 'NeonIconButton.tsx' and located in 'src/components', use:
import TextIconButton from "@/components/ui/TextIconButtons";
// Or, if using absolute imports, ensure the file exists at 'src/components/NeonIconButton.tsx'
import IncidentFormMinimal from "@/components/safety/IncidentFormMinimal";
import type { MinimalIncidentForm } from "@/components/safety/IncidentFormMinimal";
import AddFirstAidDialog from "@/components/healthsafety/AddFirstAidDialog";
import ViewFirstAidersDialog from "@/components/healthsafety/ViewFirstAidersDialog";
import { supabase } from "@/lib/supabase-client";
import OverlayDialog from "@/components/ui/OverlayDialog";

export default function HealthSafetyManager() {
  const [activeTab, setActiveTab] = useState<
    "assessments" | "incidents" | "policies" | "firstaid" | "utilities"
  >("assessments");
  const [showAddFirstAidDialog, setShowAddFirstAidDialog] = useState(false);
  const [showViewFirstAidersDialog, setShowViewFirstAidersDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Dialog states for upload/download feedback
  const [showDialog, setShowDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState<{
    title: string;
    message: string;
    type: "info" | "success" | "error" | "confirm";
    onConfirm?: () => void;
  } | null>(null);
  
  // Incident submission state
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);

  useEffect(() => {
    // Simulate fetching policies (replace with supabase or API call)
  }, []);

  // Download locations table as CSV
  const handleDownloadLocations = async () => {
    try {
      setIsDownloading(true);
      
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("site")
        .order("area")
        .order("zone");

      if (error) throw error;

      if (!data || data.length === 0) {
        setDialogContent({
          title: "No Data",
          message: "No locations data to download",
          type: "info",
        });
        setShowDialog(true);
        return;
      }

      // Convert to CSV
      const headers = ["id", "site", "area", "zone", "is_active", "created_at"];
      const csvRows = [headers.join(",")];

      data.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header];
          // Handle null values and escape commas/quotes
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvRows.push(values.join(","));
      });

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `locations_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDialogContent({
        title: "Download Complete",
        message: `Successfully downloaded ${data.length} locations to CSV file`,
        type: "success",
      });
      setShowDialog(true);
    } catch (err: any) {
      console.error("Error downloading locations:", err);
      setDialogContent({
        title: "Download Failed",
        message: `Error downloading locations: ${err.message}`,
        type: "error",
      });
      setShowDialog(true);
    } finally {
      setIsDownloading(false);
    }
  };

  // Upload locations from CSV file
  const handleUploadLocations = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv";
      
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;

        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const csvText = event.target?.result as string;
            const lines = csvText.split("\n").filter((line) => line.trim());
            
            if (lines.length < 2) {
              setDialogContent({
                title: "Invalid File",
                message: "CSV file is empty or invalid",
                type: "error",
              });
              setShowDialog(true);
              setIsUploading(false);
              return;
            }

            const headers = lines[0].split(",").map((h) => h.trim());
            const requiredHeaders = ["site"];
            const hasRequiredHeaders = requiredHeaders.every((h) => headers.includes(h));

            if (!hasRequiredHeaders) {
              setDialogContent({
                title: "Invalid Format",
                message: "CSV must contain at least 'site' column",
                type: "error",
              });
              setShowDialog(true);
              setIsUploading(false);
              return;
            }

            const locations: any[] = [];
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(",").map((v) => {
                // Remove quotes if present
                let val = v.trim();
                if (val.startsWith('"') && val.endsWith('"')) {
                  val = val.slice(1, -1).replace(/""/g, '"');
                }
                return val === "" ? null : val;
              });

              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index];
              });

              // Only include site, area, zone, is_active (skip id and created_at for new entries)
              const location: any = {
                site: row.site,
                area: row.area || null,
                zone: row.zone || null,
                is_active: row.is_active === "false" ? false : true,
              };

              locations.push(location);
            }

            if (locations.length === 0) {
              setDialogContent({
                title: "No Data",
                message: "No valid locations found in CSV",
                type: "error",
              });
              setShowDialog(true);
              setIsUploading(false);
              return;
            }

            // Confirm before upload
            setDialogContent({
              title: "Confirm Upload",
              message: `Upload ${locations.length} locations?\n\nThis will ADD new entries to the table. Existing entries will not be modified.\n\nContinue?`,
              type: "confirm",
              onConfirm: async () => {
                setShowDialog(false);
                try {
                  // Insert locations (upsert will update if exists, insert if new)
                  const { data, error } = await supabase
                    .from("locations")
                    .upsert(locations, { 
                      onConflict: "site,area,zone",
                      ignoreDuplicates: false 
                    })
                    .select();

                  if (error) throw error;

                  setDialogContent({
                    title: "Upload Complete",
                    message: `Successfully uploaded ${locations.length} locations!`,
                    type: "success",
                  });
                  setShowDialog(true);
                } catch (err: any) {
                  setDialogContent({
                    title: "Upload Failed",
                    message: `Error uploading: ${err.message}`,
                    type: "error",
                  });
                  setShowDialog(true);
                } finally {
                  setIsUploading(false);
                }
              },
            });
            setShowDialog(true);
            setIsUploading(false);
            
          } catch (err: any) {
            console.error("Error processing CSV:", err);
            setDialogContent({
              title: "Processing Error",
              message: `Error processing CSV: ${err.message}`,
              type: "error",
            });
            setShowDialog(true);
            setIsUploading(false);
          }
        };

        reader.readAsText(file);
      };

      input.click();
    } catch (err: any) {
      console.error("Error uploading locations:", err);
      setDialogContent({
        title: "Upload Error",
        message: `Error uploading locations: ${err.message}`,
        type: "error",
      });
      setShowDialog(true);
      setIsUploading(false);
    }
  };

  // Handle incident submission
  const handleIncidentSubmit = async (data: MinimalIncidentForm) => {
    try {
      setIsSubmittingIncident(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to submit an incident");
      }

      // Find the location_id based on site/area/zone
      let location_id = null;
      if (data.site) {
        const { data: locationData } = await supabase
          .from("locations")
          .select("id")
          .eq("site", data.site)
          .eq("area", data.area || null)
          .eq("zone", data.zone || null)
          .single();
        
        location_id = locationData?.id || null;
      }

      // Prepare incident data
      const incidentData = {
        incident_type: data.incidentType,
        occurred_date: data.occurredDate,
        occurred_time: data.occurredTime,
        site: data.site,
        area: data.area || null,
        zone: data.zone || null,
        location_id: location_id,
        description: data.description,
        persons_involved: data.personsInvolved,
        witnesses: data.witnesses,
        weather_conditions: data.weatherConditions || null,
        temperature: data.temperature || null,
        visibility: data.visibility || null,
        reported_by: user.id,
        status: "open",
      };

      // Insert incident
      const { data: insertedIncident, error: insertError } = await supabase
        .from("incidents")
        .insert([incidentData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Show success message
      setDialogContent({
        title: "Incident Submitted",
        message: `Incident report has been successfully submitted.\n\nIncident ID: ${insertedIncident.id}\nType: ${data.incidentType}\nDate: ${data.occurredDate}`,
        type: "success",
      });
      setShowDialog(true);

    } catch (err: any) {
      console.error("Error submitting incident:", err);
      setDialogContent({
        title: "Submission Failed",
        message: `Failed to submit incident: ${err.message}`,
        type: "error",
      });
      setShowDialog(true);
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  return (
    <>
      <FolderTabs
            tabs={[
              { key: "assessments", label: "Risk Assessments", icon: <FiClipboard /> },
              { key: "incidents", label: "Incidents", icon: <FiAlertCircle /> },
              { key: "policies", label: "Policies", icon: <FiFileText /> },
              { key: "firstaid", label: "First Aid", icon: <FiHeart /> },
              { key: "utilities", label: "Utilities", icon: <FiTool /> },
            ]}
            activeTab={activeTab}
            onChange={tabKey => setActiveTab(tabKey as typeof activeTab)}
            toolbar={
              <>
                {activeTab === "assessments" && (
                  <>
                    <TextIconButton
                      variant="add"
                      label="Create Risk Assessment"
                      onClick={() => console.log("Create assessment")}
                    />
                    <TextIconButton
                      variant="download"
                      label="Download Risk Assessments"
                      onClick={() => console.log("Download assessments")}
                    />
                    <TextIconButton
                      variant="upload"
                      label="Upload Risk Assessment"
                      onClick={() => console.log("Upload assessment")}
                    />
                  </>
                )}

                {activeTab === "incidents" && (
                  <>
                    <TextIconButton
                      variant="add"
                      label="Report New Incident"
                      onClick={() => console.log("New incident")}
                    />
                    <TextIconButton
                      variant="view"
                      label="View All Incidents"
                      onClick={() => console.log("View incidents")}
                    />
                    <TextIconButton
                      variant="download"
                      label="Export Incidents"
                      onClick={() => console.log("Export incidents")}
                    />
                  </>
                )}

                {activeTab === "policies" && (
                  <>
                    <TextIconButton
                      variant="add"
                      label="Add Policy"
                      onClick={() => console.log("Add policy")}
                    />
                    <TextIconButton
                      variant="view"
                      label="View All Policies"
                      onClick={() => console.log("View policies")}
                    />
                    <TextIconButton
                      variant="edit"
                      label="Manage Categories"
                      onClick={() => console.log("Manage categories")}
                    />
                  </>
                )}

                {activeTab === "firstaid" && (
                  <>
                    <TextIconButton
                      variant="add"
                      label="Add First Aid Designation"
                      onClick={() => setShowAddFirstAidDialog(true)}
                    />
                    <TextIconButton
                      variant="view"
                      label="View Trained First Aiders"
                      onClick={() => setShowViewFirstAidersDialog(true)}
                    />
                    <TextIconButton
                      variant="view"
                      label="View All First Aiders"
                      onClick={() => (window.location.href = "/health-safety/firstaid")}
                    />
                  </>
                )}

                {activeTab === "utilities" && (
                  <>
                    <TextIconButton
                      variant="edit"
                      label="System Settings"
                      onClick={() => (window.location.href = "/health-safety/settings")}
                    />
                    <TextIconButton
                      variant="view"
                      label="View Audit Log"
                      onClick={() => (window.location.href = "/health-safety/audit-log")}
                    />
                  </>
                )}
              </>
            }
          />

          {activeTab === "assessments" && <RiskAssessmentManager />}

          {activeTab === "incidents" && (
            <NeonPanel>
              {/* Render the minimal incident form from incidents/add */}
              <IncidentFormMinimal
                onSubmit={async (data: MinimalIncidentForm) => {
                  // TODO: handle incident submission (e.g., save to supabase)
                  // You can add your logic here or pass a handler from parent
                }}
              />
            </NeonPanel>
          )}

          {activeTab === "policies" && <HealthSafetyPolicyManager />}

          {activeTab === "firstaid" && (
            <NeonPanel>
              <h2 className="neon-form-title">
                <FiHeart /> First Aid Management
              </h2>

              <p className="neon-info">
                Designate employees as first aid qualified by completing their training certification process.
              </p>

              <AddFirstAidDialog
                open={showAddFirstAidDialog}
                onClose={() => setShowAddFirstAidDialog(false)}
                onAdded={() => {
                  console.log("First aid designation added successfully");
                  // Optionally refresh data or show success notification
                }}
              />

              <ViewFirstAidersDialog
                open={showViewFirstAidersDialog}
                onClose={() => setShowViewFirstAidersDialog(false)}
              />
            </NeonPanel>
          )}

          {activeTab === "utilities" && (
            <NeonPanel>
              <h2 className="neon-form-title">
                <FiTool /> Health & Safety Utilities
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                {/* Location Management */}
                <div style={{ 
                  padding: '1.5rem', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px',
                  backgroundColor: 'var(--background-secondary)'
                }}>
                  <h3 style={{ color: 'var(--neon)', marginBottom: '0.75rem', fontSize: '1.125rem' }}>
                    Location Management
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    Manage sites, areas, and zones for incident reporting and risk assessments.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <TextIconButton
                      variant="view"
                      icon={<FiClipboard />}
                      label="Manage Locations"
                      onClick={() => (window.location.href = "/health-safety/locations")}
                    />
                    <TextIconButton
                      variant="download"
                      label={isDownloading ? "Downloading..." : "Download CSV"}
                      title={isDownloading ? "Downloading..." : "Download CSV"}
                      onClick={handleDownloadLocations}
                      disabled={isDownloading}
                    />
                    <TextIconButton
                      variant="upload"
                      label={isUploading ? "Uploading..." : "Upload CSV"}
                      title={isUploading ? "Uploading..." : "Upload CSV"}
                      onClick={handleUploadLocations}
                      disabled={isUploading}
                    />
                  </div>
                </div>

                {/* Reports & Analytics */}
                <div style={{ 
                  padding: '1.5rem', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px',
                  backgroundColor: 'var(--background-secondary)'
                }}>
                  <h3 style={{ color: 'var(--neon)', marginBottom: '0.75rem', fontSize: '1.125rem' }}>
                    Reports & Analytics
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    View incident trends, weather correlations, and safety metrics.
                  </p>
                  <TextIconButton
                    variant="view"
                    icon={<FiAlertCircle />}
                    label="View Reports"
                    onClick={() => (window.location.href = "/health-safety/reports")}
                  />
                </div>

                {/* Safety Templates */}
                <div style={{ 
                  padding: '1.5rem', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px',
                  backgroundColor: 'var(--background-secondary)'
                }}>
                  <h3 style={{ color: 'var(--neon)', marginBottom: '0.75rem', fontSize: '1.125rem' }}>
                    Safety Templates
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    Access and customize safety forms, checklists, and documentation templates.
                  </p>
                  <TextIconButton
                    variant="view"
                    icon={<FiFileText />}
                    label="View Templates"
                    onClick={() => (window.location.href = "/health-safety/templates")}
                  />
                </div>

                {/* Emergency Contacts */}
                <div style={{ 
                  padding: '1.5rem', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px',
                  backgroundColor: 'var(--background-secondary)'
                }}>
                  <h3 style={{ color: 'var(--neon)', marginBottom: '0.75rem', fontSize: '1.125rem' }}>
                    Emergency Contacts
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    Manage emergency contact lists and notification settings.
                  </p>
                  <TextIconButton
                    variant="view"
                    icon={<FiHeart />}
                    label="Manage Contacts"
                    onClick={() => (window.location.href = "/health-safety/emergency-contacts")}
                  />
                </div>

                {/* Audit Trail */}
                <div style={{ 
                  padding: '1.5rem', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px',
                  backgroundColor: 'var(--background-secondary)'
                }}>
                  <h3 style={{ color: 'var(--neon)', marginBottom: '0.75rem', fontSize: '1.125rem' }}>
                    Audit Trail
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    Review system activity logs and compliance audit history.
                  </p>
                  <TextIconButton
                    variant="view"
                    icon={<FiClipboard />}
                    label="View Audit Log"
                    onClick={() => (window.location.href = "/health-safety/audit-log")}
                  />
                </div>

                {/* Settings */}
                <div style={{ 
                  padding: '1.5rem', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px',
                  backgroundColor: 'var(--background-secondary)'
                }}>
                  <h3 style={{ color: 'var(--neon)', marginBottom: '0.75rem', fontSize: '1.125rem' }}>
                    System Settings
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    Configure notification preferences, incident types, and system defaults.
                  </p>
                  <TextIconButton
                    variant="edit"
                    icon={<FiTool />}
                    label="Settings"
                    onClick={() => (window.location.href = "/health-safety/settings")}
                  />
                </div>
              </div>
            </NeonPanel>
          )}

      {/* Overlay Dialog for feedback messages */}
      <OverlayDialog showCloseButton={true}
        open={showDialog}
        onClose={() => setShowDialog(false)}
        ariaLabelledby="feedback-dialog-title"
      >
        <div style={{ padding: "2rem" }}>
          <h2 
            id="feedback-dialog-title"
            style={{ 
              fontSize: "1.5rem", 
              fontWeight: "600", 
              color: dialogContent?.type === "error" ? "#ef4444" : 
                     dialogContent?.type === "success" ? "#10b981" : 
                     "var(--neon)", 
              marginBottom: "1rem" 
            }}
          >
            {dialogContent?.title}
          </h2>
          <p style={{ 
            color: "var(--text)", 
            marginBottom: "1.5rem",
            whiteSpace: "pre-line",
            lineHeight: "1.6"
          }}>
            {dialogContent?.message}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            {dialogContent?.type === "confirm" ? (
              <>
                <TextIconButton
                  variant="cancel"
                  label="Cancel"
                  onClick={() => {
                    setShowDialog(false);
                    setIsUploading(false);
                  }}
                />
                <TextIconButton
                  variant="save"
                  label="Confirm"
                  onClick={() => {
                    if (dialogContent.onConfirm) {
                      dialogContent.onConfirm();
                    }
                  }}
                />
              </>
            ) : (
              <TextIconButton
                variant="cancel"
                label="Close"
                onClick={() => setShowDialog(false)}
              />
            )}
          </div>
        </div>
      </OverlayDialog>
    </>
  );
}
