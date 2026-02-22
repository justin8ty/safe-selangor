"use client";

import { useState } from "react";
import { X, MapPin, CheckCircle, PersonStanding, AlertTriangle, Eye, ShieldAlert } from "lucide-react";

const INCIDENT_TYPES = [
    { id: "theft", label: "Theft", icon: PersonStanding },
    { id: "assault", label: "Assault", icon: ShieldAlert },
    { id: "accident", label: "Accident", icon: AlertTriangle },
    { id: "suspicious", label: "Suspicious", icon: Eye },
];

interface ReportModalProps {
    open: boolean;
    onClose: () => void;
}

export default function ReportPop({ open, onClose }: ReportModalProps) {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [location, setLocation] = useState("");
    const [details, setDetails] = useState("");

    if (!open) return null;

    const handleSubmit = () => {
        console.log({ location, selectedType, details });
        // TODO: POST to backend
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">REPORT INCIDENT</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Help the Safe Selangor Community Stay Informed
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 1. Location */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">1. CONFIRM LOCATION</h3>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-4 py-3 pl-10 text-sm text-foreground appearance-none"
                        >
                            <option value="">Select region...</option>
                        </select>
                    </div>
                </div>

                {/* 2. Incident Type */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">2. SELECT INCIDENT TYPE</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {INCIDENT_TYPES.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setSelectedType(id)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${selectedType === id
                                    ? "bg-destructive text-destructive-foreground border-destructive"
                                    : "border-input bg-background text-foreground hover:border-muted-foreground"
                                    }`}
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-sm font-medium">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Details */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">3. ADD DETAILS</h3>
                    <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Describe what you see. Specific details help the community."
                        rows={4}
                        className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                    />
                </div>

                {/* Submit */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={!location || !selectedType}
                        className="flex items-center gap-2 bg-destructive text-destructive-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Submit Report
                    </button>
                </div>
            </div>
        </div>
    );
}