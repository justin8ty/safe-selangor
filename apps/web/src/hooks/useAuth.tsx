"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthUser {
    id: string;
    email: string;
    role: string | null;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let active = true;
        let generation = 0;

        const hydrateSession = async (session: Session | null, currentGeneration: number) => {
            if (!session?.user) {
                if (active && currentGeneration === generation) {
                    setUser(null);
                    setIsLoading(false);
                }
                return;
            }

            let role: string | null = null;
            try {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .maybeSingle();
                role = profile?.role ?? null;
            } catch {
                role = null;
            }

            if (active && currentGeneration === generation) {
                setUser({
                    id: session.user.id,
                    email: session.user.email ?? "",
                    role,
                });
                setIsLoading(false);
            }
        };

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                const currentGeneration = ++generation;
                setIsLoading(true);

                // Return from the auth callback before querying Supabase. Awaiting
                // another Supabase call here can deadlock the auth client lock.
                queueMicrotask(() => {
                    void hydrateSession(session, currentGeneration);
                });
            }
        );

        return () => {
            active = false;
            listener.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
