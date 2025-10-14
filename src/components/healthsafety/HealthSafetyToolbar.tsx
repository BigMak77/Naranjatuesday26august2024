"use client";

import React, { useState } from "react";
import { FiHeart, FiPlus } from "react-icons/fi";
import NeonIconButton from "@/components/ui/NeonIconButton";
import AddFirstAidWidget from "@/components/healthsafety/AddFirstAidWidget";

export default function HealthSafetyToolbar() {
  const [showAddFirstAidWidget, setShowAddFirstAidWidget] = useState(false);

  return (
    <>
      <section className="section-toolbar">
        <div className="inner">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <NeonIconButton
              variant="add"
              icon={<FiPlus />}
              title="Add First Aid Designation"
              onClick={() => setShowAddFirstAidWidget(!showAddFirstAidWidget)}
            />
            <NeonIconButton
              variant="view"
              icon={<FiHeart />}
              title="View All First Aiders"
              onClick={() => (window.location.href = "/firstaid/")}
            />
          </div>
        </div>
      </section>

      {showAddFirstAidWidget && (
        <section style={{ 
          padding: '1rem', 
          backgroundColor: 'var(--bg-panel)', 
          borderBottom: '1px solid var(--border-color)' 
        }}>
          <div className="inner">
            <AddFirstAidWidget 
              onAdded={() => {
                console.log("First aid designation added successfully");
                setShowAddFirstAidWidget(false);
              }} 
            />
          </div>
        </section>
      )}
    </>
  );
}
