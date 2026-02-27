export interface CreateReportInput {
    reportId: string;
    district: string;
    storageKeys: string[];
    type: "violent" | "property";
    details?: string;
}

export interface Report {
    id: string;
    user_id: string;
    type: "violent" | "property" | null;
    description: string | null;
    status: "needs_moderator" | "approved" | "rejected";
    ai_confidence: number | null;
    created_at: string;
    district: string | null;
    state: string | null;
    landmark_label?: string | null;
}

export interface ModerationQueueItem {
    reportId: string;
    queue?: { status: string; createdAt: string };
    report: Report | null;
    media: string[];
}

export interface FeedItem {
    reportId: string;
    state: string | null;
    district: string | null;
    type: string | null;
    description: string | null;
    date: string | null;
    createdAt: string | null;
    mediaKey: string | null;
    likes: number | null;
    views: number | null;
    landmarkLabel?: string | null;
}
