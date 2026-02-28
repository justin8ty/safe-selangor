"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/client";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster />
            </QueryClientProvider>
        </AuthProvider>
    );
}
