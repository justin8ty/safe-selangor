"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {

    return (
        <div className="relative flex h-full flex-1 flex-col items-center justify-center overflow-hidden bg-background">
            {/* Background ambient lighting */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

            <div className="z-10 w-full max-w-md px-4">
                <Card className="border-border/50 bg-background/60 shadow-2xl backdrop-blur-xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-3xl font-bold tracking-tight">
                            Create an account
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Enter your details below to create your account
                        </CardDescription>
                    </CardHeader>
                    <form>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                    className="bg-background/50 transition-colors focus:bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    required
                                    className="bg-background/50 transition-colors focus:bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    className="bg-background/50 transition-colors focus:bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    required
                                    className="bg-background/50 transition-colors focus:bg-background"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="mt-4 flex flex-col space-y-4">
                            <Button type="submit" className="w-full">
                                Create Account
                            </Button>
                            <div className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="font-medium text-primary hover:underline"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
