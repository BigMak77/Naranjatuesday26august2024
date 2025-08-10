"use client";

import React, { useState } from 'react';
import RiskAssessmentManager from '@/components/turkus/RiskAssessmentManager';
import { FiClipboard, FiAlertCircle, FiFileText, FiHeart } from 'react-icons/fi';
import NeonForm from '@/components/NeonForm';
import NeonFeatureCard from '@/components/NeonFeatureCard';
import NeonPanel from '@/components/NeonPanel';

export default function HealthSafetyManager() {
  const [activeTab, setActiveTab] = useState<'assessments' | 'incidents' | 'policies' | 'firstaid'>('assessments');

  return (
    <div>
      <div className="neon-tab-bar mb-6 flex gap-2 flex-wrap">
        <button
          className={`neon-tab-btn${activeTab === 'assessments' ? ' active' : ''}`}
          onClick={() => setActiveTab('assessments')}
          type="button"
          aria-pressed={activeTab === 'assessments'}
        >
          <span className="flex items-center gap-2">
            <FiClipboard /> Risk Assessments
          </span>
        </button>
        <button
          className={`neon-tab-btn${activeTab === 'incidents' ? ' active' : ''}`}
          onClick={() => setActiveTab('incidents')}
          type="button"
          aria-pressed={activeTab === 'incidents'}
        >
          <span className="flex items-center gap-2">
            <FiAlertCircle /> Incidents
          </span>
        </button>
        <button
          className={`neon-tab-btn${activeTab === 'policies' ? ' active' : ''}`}
          onClick={() => setActiveTab('policies')}
          type="button"
          aria-pressed={activeTab === 'policies'}
        >
          <span className="flex items-center gap-2">
            <FiFileText /> Policies
          </span>
        </button>
        <button
          className={`neon-tab-btn${activeTab === 'firstaid' ? ' active' : ''}`}
          onClick={() => setActiveTab('firstaid')}
          type="button"
          aria-pressed={activeTab === 'firstaid'}
        >
          <span className="flex items-center gap-2">
            <FiHeart /> First Aid
          </span>
        </button>
      </div>

      {activeTab === 'assessments' && <RiskAssessmentManager />}

      {activeTab === 'incidents' && (
        <NeonPanel>
          <NeonForm
            title="Incident Report Form"
            onSubmit={e => { e.preventDefault(); /* handle incident submit */ }}
          >
            <input className="neon-input" placeholder="Incident Title" />
            <textarea className="neon-input" placeholder="Description" rows={3} />
          </NeonForm>
        </NeonPanel>
      )}

      {activeTab === 'policies' && (
        <NeonPanel>
          <NeonForm
            title="Policy Upload"
            onSubmit={e => { e.preventDefault(); /* handle policy upload */ }}
          >
            <input className="neon-input" placeholder="Policy Title" />
            <textarea className="neon-input" placeholder="Policy Details" rows={3} />
          </NeonForm>
        </NeonPanel>
      )}

      {activeTab === 'firstaid' && (
        <NeonPanel>
          <h2 className="neon-form-title flex items-center gap-2">
            <FiHeart /> First Aid Information
          </h2>
          <p className="neon-info text-lg">
            This section will soon provide details about first aid procedures, contacts, and resources for your site.
          </p>
        </NeonPanel>
      )}
    </div>
  );
}
