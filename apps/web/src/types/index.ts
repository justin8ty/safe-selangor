export interface CreateReportInput {
    storageKeys: string[];
    lat: number;
    lng: number;
    state: string;
    district: string;
    category: string;
    type: string;
    description?: string;
    date?: string;
}

export interface Report {
    id: string;
    user_id: string;
    category: string;
    type: string;
    description: string | null;
    date: string;
    status: "pending" | "approved" | "rejected";
    ai_confidence: number | null;
    ai_explanation: string | null;
    created_at: string;
    district: string;
    state: string;
}

export interface ModerationQueueItem {
    reportId: string;
    queue: { status: string; createdAt: string };
    report: Report | null;
    media: string[];
}

export interface FeedItem {
    reportId: string;
    state: string | null;
    district: string | null;
    category: string | null;
    type: string | null;
    description: string | null;
    date: string | null;
    createdAt: string | null;
    mediaKey: string | null;
    likes: number | null;
    views: number | null;
}
