import { getRequest, postRequest } from "./interceptor";
import { CreateReportInput } from "@/types";

export async function getProfile() {
    return await getRequest({ url: "/auth/me " });
}

export async function createReport(data: CreateReportInput) {
    return await postRequest({ url: "/reports", data });
}

export async function getFeed() {
    return await getRequest({ url: "/feed" });
}

export async function getModerationQueue() {
    return await getRequest({ url: "/moderation/queue" });
}

export async function approveReport(reportId: string) {
    return await postRequest({ url: `/moderation/${reportId}/approve` });
}

export async function rejectReport(reportId: string) {
    return await postRequest({ url: `/moderation/${reportId}/reject` });
}