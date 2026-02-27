"use client";
import { createContext, useContext, useEffect, useState } from "react";
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
        supabase.auth.getSession().then(({ data }) => {
            if (data.session?.user) {
                supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", data.session.user.id)
                    .single()
                    .then(({ data: profile }) => {
                        setUser({
                            id: data.session!.user.id,
                            email: data.session!.user.email ?? "",
                            role: profile?.role ?? null,
                        });
                        setIsLoading(false);
                    });
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        const { data: listener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", session.user.id)
                        .single();

                    setUser({
                        id: session.user.id,
                        email: session.user.email ?? "",
                        role: profile?.role ?? null,
                    });
                } else {
                    setUser(null);
                }
            }
        );

        return () => listener.subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
