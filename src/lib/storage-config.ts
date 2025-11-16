// Storage bucket configuration
// Centralized bucket names to prevent inconsistencies

export const STORAGE_BUCKETS = {
  DOCUMENTS: "documents",
  MODULES: "modules", 
  TRAINING: "training-materials",
  ISSUES: "issue-evidence",
  APPLICATIONS: "job-applications",
} as const;

// Legacy bucket names for reference (DO NOT USE)
// These were the old inconsistent names that caused folder mismatch issues:
// - "NARANJA DOCS" (had spaces, caused navigation issues) 
// - "MODULES" (uppercase, inconsistent with lowercase convention)
// - "applications-cv" (inconsistent naming pattern)
// - "issue-evidence" (should follow same pattern)

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

// Helper function to get bucket name
export const getBucketName = (type: keyof typeof STORAGE_BUCKETS): string => {
  return STORAGE_BUCKETS[type];
};
