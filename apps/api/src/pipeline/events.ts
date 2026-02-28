export const PipelineEvents = {
  SUBMITTED: "report.submitted",
  LANDMARKED: "report.landmarked",
  MODERATED: "report.moderated",
  NEEDS_MODERATOR: "report.needs_moderator",
  APPROVED: "report.approved",
  REJECTED: "report.rejected",
  PUBLISHED: "report.published",
  ERROR: "report.error",
} as const;

export type PipelineEvent =
  (typeof PipelineEvents)[keyof typeof PipelineEvents];

export interface PipelineContext {
  reportId: string;
  userId: string;
  lat?: number;
  lng?: number;
  storageKeys?: string[];
  landmarkLabel?: string;
  district?: string;
  state?: string;
  aiConfidence?: number;
  aiDecision?: "approved" | "rejected" | "needs_moderator";
  aiCaption?: string;
  userDetails?: string;
  error?: Error;
}
