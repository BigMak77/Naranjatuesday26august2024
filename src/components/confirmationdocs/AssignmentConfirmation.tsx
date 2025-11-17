"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import TextIconButton from "../ui/TextIconButtons";
import { FiCheck, FiX, FiFileText } from "react-icons/fi";

export interface AssignmentConfirmationProps {
  assignmentId: string;
  userId: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  customAgreementText?: string;
}

interface AssignmentDetails {
  id: string;
  item_id: string;
  item_type: string;
  assigned_at: string;
  due_at: string | null;
  item_title: string;
  reference_code: string | null;
  document_url: string | null;
  user_name: string;
  user_email: string;
}

export default function AssignmentConfirmation({
  assignmentId,
  userId,
  onConfirm,
  onCancel,
  customAgreementText,
}: AssignmentConfirmationProps) {
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignmentDetails();
  }, [assignmentId]);

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("pending_confirmations")
        .select("*")
        .eq("assignment_id", assignmentId)
        .eq("auth_id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError("Assignment not found or already confirmed");
        return;
      }

      setAssignment(data);
    } catch (err) {
      console.error("Error fetching assignment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load assignment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreed) {
      setError("You must agree to the terms before confirming.");
      return;
    }

    if (!signature.trim()) {
      setError("Please enter your full name as a signature.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the database function to confirm the assignment
      const { data, error: confirmError } = await supabase.rpc(
        "confirm_user_assignment",
        {
          p_assignment_id: assignmentId,
          p_signature: signature,
          p_notes: customAgreementText || null,
          p_ip_address: null, // Could be captured server-side if needed
        }
      );

      if (confirmError) throw confirmError;

      if (onConfirm) {
        onConfirm();
      }
    } catch (err) {
      console.error("Error confirming assignment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to confirm assignment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="neon-card">
        <div className="neon-card-body">
          <p className="text-gray-400">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="neon-card">
        <div className="neon-card-body">
          <p className="text-red-400">{error}</p>
          {onCancel && (
            <TextIconButton
              variant="close"
              icon={<FiX />}
              label="Go Back"
              onClick={onCancel}
              className="mt-4"
            />
          )}
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  const defaultAgreementText = `I confirm that I have read and understood the contents of "${assignment.item_title}" and agree to abide by all policies, procedures, and requirements outlined within this ${assignment.item_type}.`;

  return (
    <div className="neon-card">
      <div className="neon-card-header">
        <div className="flex items-center gap-2">
          <FiFileText className="text-primary-neon" size={24} />
          <h3 className="neon-card-title">
            {assignment.item_type === "document"
              ? "Document"
              : "Training Module"}{" "}
            Confirmation Required
          </h3>
        </div>
      </div>

      <div className="neon-card-body">
        <div className="space-y-4">
          {/* Assignment Information */}
          <div className="neon-info-box">
            <p className="font-semibold text-sm text-gray-300">
              {assignment.item_type === "document" ? "Document:" : "Module:"}
            </p>
            <p className="text-white">{assignment.item_title}</p>
            {assignment.reference_code && (
              <p className="text-sm text-gray-400">
                Reference: {assignment.reference_code}
              </p>
            )}
            {assignment.document_url && (
              <a
                href={assignment.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="neon-link mt-2 inline-block"
              >
                View Document
              </a>
            )}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                Assigned: {new Date(assignment.assigned_at).toLocaleString()}
              </p>
              {assignment.due_at && (
                <p className="text-xs text-gray-400">
                  Due: {new Date(assignment.due_at).toLocaleString()}
                </p>
              )}
            </div>
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

            {/* User Information Display */}
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-3">
              <p>Confirming as: {assignment.user_name || assignment.user_email}</p>
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
