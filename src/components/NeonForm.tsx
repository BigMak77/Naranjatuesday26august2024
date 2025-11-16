"use client";

import React from "react";
import TextIconButton from "./ui/TextIconButtons";
import { FiX } from "react-icons/fi";

// NOTE: All styling for NeonForm is provided by global neon design system classes in globals.css
// No local styles are used here. All class names below should be defined in globals.css for consistency.

type NeonFormProps = {
  title?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  submitLabel?: string;
  onCancel?: () => void;
};

export default function NeonForm({
  title,
  onSubmit,
  children,
  submitLabel = "Submit",
  onCancel,
}: NeonFormProps) {
  return (
    <form className="neon-form" onSubmit={onSubmit}>
      {title && <h2 className="neon-form-title">{title}</h2>}
      {children}
      <div className="neon-form-actions">
        {onCancel && (
          <TextIconButton
            variant="close"
            icon={<FiX />}
            label="Cancel"
            type="button"
            onClick={onCancel}
            className="neon-btn-close"
          />
        )}
        <TextIconButton
          variant="save"
          label={submitLabel}
          title={submitLabel}
          type="submit"
          className="neon-btn-square-form"
        />
      </div>
    </form>
  );
}
