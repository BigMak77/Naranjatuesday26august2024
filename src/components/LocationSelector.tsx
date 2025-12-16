'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabase-client';

export default function LocationSelector() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locations = [
    { name: 'England', color: '#FF0000', borderColor: '#CC0000' }, // Red
    { name: 'Wales', color: '#00FF00', borderColor: '#00CC00' }, // Green
    { name: 'Poland', color: '#FF69B4', borderColor: '#FF1493' }, // Pink
    { name: 'Group', color: '#FFD700', borderColor: '#FFA500' }, // Gold
  ];

  // Set selected location if user already has one
  useEffect(() => {
    if (user?.location) {
      setSelectedLocation(user.location);
    }
  }, [user]);

  const handleLocationSelect = async (locationName: string) => {
    if (!user?.id) return;

    setSelectedLocation(locationName);
    setSaving(true);
    setError(null);

    try {
      // Update user's location in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ location: locationName })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Redirect to landing page after successful save
      setTimeout(() => {
        router.push('/landingpage');
      }, 500);
    } catch (err) {
      console.error('Error saving location:', err);
      setError('Failed to save location. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="location-selector-wrapper">
        <div className="location-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="location-selector-wrapper">
      {/* Logo Section */}
      <div className="location-logo-section">
        <Image
          src="/landing page image.png"
          alt="Naranja Logo"
          width={240}
          height={240}
          priority
          unoptimized
          className="location-logo"
        />
      </div>

      {/* Content Section */}
      <div className="location-content">
        <p className="location-subtitle">
          Please select your location to continue
        </p>

        {/* Location Selector */}
        <div className="location-selector">
          <h2 className="location-selector-title">Select Your Location</h2>
          <div className="location-options">
            {locations.map((location) => (
              <button
                key={location.name}
                className={`location-option ${selectedLocation === location.name ? 'selected' : ''} ${saving ? 'disabled' : ''}`}
                onClick={() => handleLocationSelect(location.name)}
                disabled={saving}
                style={{
                  '--location-color': location.color,
                  '--location-border-color': location.borderColor,
                } as React.CSSProperties}
              >
                <div className="location-option-inner">
                  <span className="location-name">{location.name}</span>
                  {selectedLocation === location.name && saving && (
                    <span className="location-saving">Saving...</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          {error && <p className="location-error">{error}</p>}
        </div>
      </div>

      <style jsx>{`
        .location-selector-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 2rem 2rem;
        }

        .location-logo-section {
          margin-top: 2rem;
          margin-bottom: 3rem;
          display: flex;
          justify-content: center;
        }

        .location-logo-section :global(.location-logo) {
          border-radius: 12px;
        }

        .location-content {
          max-width: 1200px;
          width: 100%;
          z-index: 2;
          text-align: center;
        }

        .location-title {
          font-family: var(--font-family);
          font-size: 2.5rem;
          font-weight: var(--font-weight-header);
          color: var(--text-white);
          margin: 0 0 1rem 0;
          animation: slideDown 0.6s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .location-subtitle {
          font-family: var(--font-family);
          font-size: var(--font-size-subheader);
          font-weight: var(--font-weight-normal);
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          animation: slideDown 0.6s ease-out 0.2s both;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .location-loading {
          font-family: var(--font-family);
          font-size: var(--font-size-subheader);
          font-weight: var(--font-weight-normal);
          color: rgba(255, 255, 255, 0.6);
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .location-selector {
          margin-top: 3rem;
          animation: slideDown 0.6s ease-out 0.4s both;
        }

        .location-selector-title {
          font-family: var(--font-family);
          font-size: 1.5rem;
          font-weight: var(--font-weight-header);
          color: var(--text-white);
          margin: 0 0 2rem 0;
        }

        .location-options {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .location-option {
          position: relative;
          background: rgba(0, 0, 0, 0.4);
          border: 2px solid var(--location-border-color);
          border-radius: 12px;
          padding: 3rem 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: var(--font-family);
          font-size: 1.1rem;
          font-weight: var(--font-weight-bold);
          color: var(--text-white);
          overflow: hidden;
          min-height: 160px;
        }

        .location-option.disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .location-option::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--location-color);
          opacity: 0.1;
          transition: opacity 0.3s ease;
        }

        .location-option:hover:not(.disabled) {
          transform: translateY(-2px);
          border-color: var(--location-color);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .location-option:hover:not(.disabled)::before {
          opacity: 0.2;
        }

        .location-option.selected {
          border-color: var(--location-color);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          transform: scale(1.02);
        }

        .location-option.selected::before {
          opacity: 0.3;
        }

        .location-option-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .location-name {
          color: var(--location-color);
          font-size: 1.2rem;
        }

        .location-saving {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 0.5rem;
        }

        .location-error {
          color: #ff4d4f;
          font-weight: 600;
          text-align: center;
          margin-top: 1.5rem;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .location-logo-section :global(.location-logo) {
            width: 160px;
            height: 160px;
          }

          .location-title {
            font-size: 2rem;
          }

          .location-subtitle {
            font-size: var(--font-size-base);
          }

          .location-selector-title {
            font-size: 1.2rem;
          }

          .location-options {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .location-option {
            padding: 2.5rem 0.75rem;
            font-size: 0.9rem;
            min-height: 140px;
          }

          .location-name {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
