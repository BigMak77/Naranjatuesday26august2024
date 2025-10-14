"use client";

import UtilityWidget from "@/components/utility/UtilityWidget";
import MainHeader from "@/components/ui/MainHeader";
import { useState } from "react";
import DocumentTypeTable from "@/components/documents/DocumentTypeTable";
import ShiftPatternsTable from "@/components/utility/ShiftPatternsTable";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import AddAuditorWidget from "@/components/audit/AddAuditorWidget";
import AuditorsListWidget from "@/components/audit/AuditorsListWidget";
import AddTrainerWidget from "@/components/audit/AddTrainerWidget";
import AddFirstAidWidget from "@/components/healthsafety/AddFirstAidWidget";

export default function UtilityPage() {
  const [openDocTypes, setOpenDocTypes] = useState(true);
  const [openShifts, setOpenShifts] = useState(true);
  const [openAuditors, setOpenAuditors] = useState(true);

  return (
    <main className="after-hero">
      <div className="global-content">
        <MainHeader 
          title="Admin Utilities" 
          subtitle="Utilities are similar to global settings, that improve the functionality of the platform." 
        />
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
            <NeonIconButton
              variant="view"
              title={openAuditors ? "Hide Auditor Tools" : "Show Auditor Tools"}
              icon={openAuditors ? <FiChevronUp /> : <FiChevronDown />}
              onClick={() => setOpenAuditors(v => !v)}
              aria-expanded={openAuditors}
              aria-controls="auditor-tools-section"
            />
            <h2 className="main-header" style={{ margin: 0 }}>Auditor Tools</h2>
          </div>
          {openAuditors && (
            <div id="auditor-tools-section" style={{ display: 'flex', gap: 32, alignItems: 'flex-start', marginTop: 16 }}>
              <div style={{ flex: 1 }}>
                <AddAuditorWidget />
              </div>
              <div style={{ flex: 1 }}>
                <AddTrainerWidget />
              </div>
              <div style={{ flex: 1 }}>
                <AddFirstAidWidget />
              </div>
            </div>
          )}
        </section>
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
            <NeonIconButton
              variant="view"
              title={openDocTypes ? "Hide Document Types" : "Show Document Types"}
              icon={openDocTypes ? <FiChevronUp /> : <FiChevronDown />}
              onClick={() => setOpenDocTypes(v => !v)}
              aria-expanded={openDocTypes}
              aria-controls="doc-types-table"
            />
            <h2 className="main-header" style={{ margin: 0 }}>Document Types</h2>
          </div>
          {openDocTypes && (
            <div id="doc-types-table">
              <DocumentTypeTable />
            </div>
          )}
        </section>
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
            <NeonIconButton
              variant="view"
              title={openShifts ? "Hide Shift Patterns" : "Show Shift Patterns"}
              icon={openShifts ? <FiChevronUp /> : <FiChevronDown />}
              onClick={() => setOpenShifts(v => !v)}
              aria-expanded={openShifts}
              aria-controls="shift-patterns-table"
            />
            <h2 className="main-header" style={{ margin: 0 }}>Shift Patterns</h2>
          </div>
          {openShifts && (
            <div id="shift-patterns-table">
              <ShiftPatternsTable />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}