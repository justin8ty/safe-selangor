import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { supabase } from "./supabase";

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

let cachedToken: string | null = null;

supabase.auth.getSession().then(({ data }) => {
    cachedToken = data.session?.access_token || null;
}).catch(() => { });

supabase.auth.onAuthStateChange((_event, session) => {
    cachedToken = session?.access_token || null;
});

axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (cachedToken) {
            config.headers.Authorization = `Bearer ${cachedToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.error || error.message || "An unexpected error occurred.";

        if (status === 401) {
            if (!window.location.pathname.includes("/login")) {
                toast.error("Session expired.");
                await supabase.auth.signOut();
                window.location.href = "/login";
            }
        } else {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export async function getRequest({ url, config }: { url: string; config?: AxiosRequestConfig }) {
    const response = await axiosInstance.get(url, config);
    return response.data;
}

export async function postRequest({ url, data, config }: { url: string; data?: unknown; config?: AxiosRequestConfig }) {
    const response = await axiosInstance.post(url, data, {
        headers: { "Content-Type": "application/json" },
        ...config,
    });
    return response.data;
}

export async function postFormRequest({ url, data, config }: { url: string; data?: unknown; config?: AxiosRequestConfig }) {
    const response = await axiosInstance.post(url, data, {
        headers: { "Content-Type": "multipart/form-data" },
        ...config,
    });
    return response.data;
}

export async function deleteRequest({ url, data, config }: { url: string; data?: unknown; config?: AxiosRequestConfig }) {
    const response = await axiosInstance.delete(url, {
        data,
        ...config
    });

    return response.data;
}
