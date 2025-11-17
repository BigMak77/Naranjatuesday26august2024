"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import TextIconButton from "../ui/TextIconButtons";
import { FiCheck, FiX, FiFileText } from "react-icons/fi";

export interface DocumentConfirmationProps {
  documentId: string;
  documentTitle: string;
  documentUrl?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  requiresSignature?: boolean;
  onConfirm?: (confirmationId: string) => void;
  onCancel?: () => void;
  customAgreementText?: string;
}

export default function DocumentConfirmation({
  documentId,
  documentTitle,
  documentUrl,
  userId,
  userEmail,
  userName,
  requiresSignature = true,
  onConfirm,
  onCancel,
  customAgreementText,
}: DocumentConfirmationProps) {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultAgreementText = `I confirm that I have read and understood the contents of "${documentTitle}" and agree to abide by all policies, procedures, and requirements outlined within this document.`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreed) {
      setError("You must agree to the terms before confirming.");
      return;
    }

    if (requiresSignature && !signature.trim()) {
      setError("Please enter your full name as a signature.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error: dbError } = await supabase
        .from("document_confirmations")
        .insert({
          document_id: documentId,
          user_id: userId,
          user_email: userEmail,
          user_name: userName,
          signature: requiresSignature ? signature : null,
          confirmed_at: new Date().toISOString(),
          ip_address: null, // Could be added via server-side if needed
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (onConfirm && data) {
        onConfirm(data.id);
      }
    } catch (err) {
      console.error("Error saving confirmation:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save confirmation"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="neon-card">
      <div className="neon-card-header">
        <div className="flex items-center gap-2">
          <FiFileText className="text-primary-neon" size={24} />
          <h3 className="neon-card-title">Document Confirmation Required</h3>
        </div>
      </div>

      <div className="neon-card-body">
        <div className="space-y-4">
          {/* Document Information */}
          <div className="neon-info-box">
            <p className="font-semibold text-sm text-gray-300">Document:</p>
            <p className="text-white">{documentTitle}</p>
            {documentUrl && (
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neon-link mt-2 inline-block"
              >
                View Document
              </a>
            )}
          </div>

          {/* Agreement Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Agreement Checkbox */}
            <div className="neon-checkbox-wrapper">
              <label className="neon-checkbox-label">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="neon-checkbox"
                  disabled={isSubmitting}
                />
                <span className="ml-2 text-sm">
                  {customAgreementText || defaultAgreementText}
                </span>
              </label>
            </div>

            {/* Signature Field */}
            {requiresSignature && (
              <div className="neon-form-group">
                <label htmlFor="signature" className="neon-label">
                  Electronic Signature (Full Name)
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Enter your full name"
                  className="neon-input"
                  disabled={isSubmitting}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  By typing your name, you are providing an electronic signature
                  and agreeing to the terms above.
                </p>
              </div>
            )}

            {/* User Information Display */}
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-3">
              <p>Confirming as: {userName || userEmail || userId}</p>
              <p>Date: {new Date().toLocaleString()}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="neon-error-box">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="neon-form-actions">
              {onCancel && (
                <TextIconButton
                  type="button"
                  variant="close"
                  icon={<FiX />}
                  label="Cancel"
                  onClick={onCancel}
                  disabled={isSubmitting}
                />
              )}
              <TextIconButton
                type="submit"
                variant="submit"
                icon={<FiCheck />}
                label={isSubmitting ? "Confirming..." : "Confirm & Agree"}
                disabled={isSubmitting || !agreed}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
