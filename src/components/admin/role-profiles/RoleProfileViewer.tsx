import React from "react";

export type RoleProfileViewerProps = {
  name: string;
  description?: string;
  modules: Array<{ module_id: string; name?: string }>;
  documents: Array<{ document_id: string; title?: string; document_type?: string }>;
  behaviours: Array<{ behaviour_id: string; name?: string; description?: string; icon?: string }>;
  assignments?: unknown[];
};

// This component has been removed as requested.
export default function RemovedRoleProfileViewer() {
  return null;
}
