import { getRequest, postRequest } from "./interceptor";
import { CreateReportInput } from "@/types";

export async function loginUser(data: { email: string; password: string }) {
    return await postRequest({ url: "/auth/login", data });
}

export async function registerUser(data: { email: string; password: string }) {
    return await postRequest({ url: "/auth/register", data });
}

export async function getProfile() {
    return await getRequest({ url: "/auth/me " });
}

export async function createReport(data: CreateReportInput) {
    return await postRequest({ url: "/reports/submit", data });
}

export async function createReportDraft(data: { lat: number; lng: number }) {
    return await postRequest({ url: "/reports/draft", data });
}

export async function getDistricts() {
    return await getRequest({ url: "/districts" });
}

export async function getReport(reportId: string) {
    return await getRequest({ url: `/reports/${reportId}` });
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
