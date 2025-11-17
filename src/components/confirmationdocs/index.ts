// Standalone document confirmation components
export { default as DocumentConfirmation } from "./DocumentConfirmation";
export { default as DocumentConfirmationStatus } from "./DocumentConfirmationStatus";
export { default as DocumentConfirmationList } from "./DocumentConfirmationList";

// Assignment-based confirmation components (integrated with user_assignments)
export { default as AssignmentConfirmation } from "./AssignmentConfirmation";
export { default as PendingConfirmationsList } from "./PendingConfirmationsList";
export { default as ConfirmationBadge } from "./ConfirmationBadge";
export { default as ConfirmationReportAdmin } from "./ConfirmationReportAdmin";

// Types
export type { DocumentConfirmationProps } from "./DocumentConfirmation";
export type { ConfirmationRecord } from "./DocumentConfirmationStatus";
export type { ConfirmationListRecord } from "./DocumentConfirmationList";
export type { AssignmentConfirmationProps } from "./AssignmentConfirmation";
