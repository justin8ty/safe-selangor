"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Map, { NavigationControl, Source, Layer, MapRef, type MapMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import MapRegionPopup, { RegionInfo } from "./MapRegionPopup";
import { FeedItem } from "@/types";
import IncidentDetailsPop, { Incident } from "./IncidentDetailsPop";
import { supabase } from "@/lib/supabase";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const SELANGOR_BOUNDS = [101.3, 2.85, 102.0, 3.35];
const EMPTY_SCORES: Record<string, { year: number; month: number; score: number }[]> = {};

function buildRegionInfo(name: string, feedItems: FeedItem[], allMonthScores: Record<string, { year: number; month: number; score: number }[]>, districtCounts: Record<string, number>): RegionInfo {
    const districtItems = feedItems
        .filter(item => item.district === name)
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

    return {
        name,
        trendScores: allMonthScores[name] ?? [],
        totalReports: districtCounts[name] || 0,
        latestIncidents: districtItems.slice(0, 2).map(item => ({
            type: item.type ?? "unknown",
            time: item.createdAt ?? "",
            description: item.description ?? "No description",
            mediaKey: item.mediaKey ?? null,
            aiConfidence: item.aiConfidence ?? null
        })),
    };
}

interface MapViewProps {
    highlightDistrict?: string;
    disableInteraction?: boolean;
    feedItems?: FeedItem[];
    allMonthScores?: Record<string, { year: number; month: number; score: number }[]>;
    districtCounts?: Record<string, number>;
}

export default function MapView({ highlightDistrict, disableInteraction, feedItems, allMonthScores = EMPTY_SCORES, districtCounts = {} }: MapViewProps) {
    const mapRef = useRef<MapRef>(null);
    const [rawGeoJSON, setRawGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
    const [regionData, setRegionData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [viewState, setViewState] = useState({ longitude: 101.68, latitude: 3.07, zoom: 10 });
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string>('grab');
    const [popupIncident, setPopupIncident] = useState<Incident | null>(null);
    const [markers, setMarkers] = useState<{ report_id: string; lat: number; lng: number }[]>([]);
    const [safetyScores, setSafetyScores] = useState<Record<string, number>>({});
    const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number }>({ year: 2026, month: 2 });

    useEffect(() => {
        fetch("/map.geojson")
            .then((res) => res.json())
            .then(setRawGeoJSON)
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!rawGeoJSON) return;
        setRegionData({
            ...rawGeoJSON,
            features: rawGeoJSON.features.map((f) => ({
                ...f,
                properties: {
                    ...f.properties,
                    safetyScore: safetyScores[f.properties?.name] ?? null,
                },
            })),
        } as GeoJSON.FeatureCollection);
    }, [rawGeoJSON, safetyScores]);

    useEffect(() => {
        if (disableInteraction) return;
        const scores: Record<string, number> = {};
        Object.entries(allMonthScores).forEach(([district, arr]) => {
            const match = arr.find(s => s.year === selectedMonth.year && s.month === selectedMonth.month);
            if (match) scores[district] = match.score;
        });
        setSafetyScores(scores);
    }, [selectedMonth, allMonthScores, disableInteraction]);

    const availableMonths = useMemo(() => {
        const seen = new Set<string>();
        const unique: { year: number; month: number }[] = [];
        Object.values(allMonthScores).flat().forEach((s) => {
            const key = `${s.year}-${s.month}`;
            if (!seen.has(key)) { seen.add(key); unique.push({ year: s.year, month: s.month }); }
        });
        return unique.sort((a, b) => a.year - b.year || a.month - b.month);
    }, [allMonthScores]);

    useEffect(() => {
        if (availableMonths.length) setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }, [availableMonths]);



    useEffect(() => {
        if (disableInteraction) return;
        supabase
            .from("report_location_private")
            .select("report_id, lat, lng")
            .then(({ data, error }) => {
                console.log("Markers:", data?.length, error);
                if (data) setMarkers(data);
            });
    }, []);


    const handleMapClick = useCallback((event: MapMouseEvent) => {
        const feature = event.features && event.features[0];
        const name = (feature as any)?.properties?.name;
        if (typeof name === "string" && name.length) {
            setSelectedRegion(name);
        } else {
            setSelectedRegion(null);
        }
    }, []);

    const onMouseEnter = useCallback(() => setCursor('pointer'), []);
    const onMouseLeave = useCallback(() => setCursor('grab'), []);

    const handleMapLoad = useCallback(() => {
        const map = mapRef.current?.getMap();
        const container = map?.getContainer();

        if (!map || !container) return;

        map.resize();

        const observer = new ResizeObserver(() => {
            if (mapRef.current?.getMap()) {
                map.resize();
            }
        });

        observer.observe(container);
    }, []);



    useEffect(() => {
        if (!highlightDistrict || !regionData) return;

        const feature = regionData.features.find(
            (f) => f.properties?.name === highlightDistrict
        );
        if (!feature) return;

        const coords =
            feature.geometry.type === "Polygon"
                ? (feature.geometry as GeoJSON.Polygon).coordinates[0]
                : feature.geometry.type === "MultiPolygon"
                    ? (feature.geometry as GeoJSON.MultiPolygon).coordinates[0][0]
                    : [];

        if (coords.length === 0) return;

        const lngs = coords.map((c) => c[0]);
        const lats = coords.map((c) => c[1]);

        setViewState({
            longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
            latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
            zoom: 8,
        });
    }, [highlightDistrict, regionData]);

    return (
        <>
            <div className="relative w-full h-full">
                <Map
                    ref={mapRef}
                    onLoad={handleMapLoad}
                    {...viewState}
                    onMove={(e) => setViewState(e.viewState)}
                    mapboxAccessToken={MAPBOX_TOKEN}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    style={{ width: "100%", height: "100%" }}
                    maxBounds={[[SELANGOR_BOUNDS[0], SELANGOR_BOUNDS[1]], [SELANGOR_BOUNDS[2], SELANGOR_BOUNDS[3]]]}
                    minZoom={9}
                    maxZoom={18}
                    interactiveLayerIds={disableInteraction ? undefined : (regionData ? ["region-fill"] : undefined)}
                    onClick={handleMapClick}
                    cursor={disableInteraction ? "default" : cursor}
                    onMouseEnter={disableInteraction ? undefined : onMouseEnter}
                    onMouseLeave={disableInteraction ? undefined : onMouseLeave}
                >
                    <NavigationControl position="top-right" />

                    {regionData && (
                        <Source id="region-zones" type="geojson" data={regionData}>
                            <Layer
                                id="region-fill"
                                type="fill"
                                paint={{
                                    "fill-color": highlightDistrict
                                        ? "#1f1f29"
                                        : [
                                            "case",
                                            ["==", ["get", "safetyScore"], null],
                                            "#1f1f29",
                                            [
                                                "step", ["get", "safetyScore"],
                                                "#1f1f29",
                                                0, "#ff2a2a",
                                                40, "#fa7b19",
                                                70, "#ddfe20",
                                                85, "#1cfa2f",
                                            ],
                                        ],

                                    "fill-opacity": highlightDistrict ? 0.3 : 0.6,
                                }}
                            />

                            <Layer
                                id="region-outline"
                                type="line"
                                paint={{
                                    "line-color": "#ffffff",
                                    "line-width": 1,
                                    "line-opacity": 0.4,
                                }}
                            />

                            <Layer
                                id="region-labels"
                                type="symbol"
                                layout={{
                                    "text-field": ["get", "name"],
                                    "text-size": 12,
                                    "text-anchor": "center",
                                    "text-justify": "center"
                                }}
                                paint={{
                                    "text-color": "#ffffff",
                                    "text-halo-color": "#000000",
                                    "text-halo-width": 2
                                }}
                            />

                            {highlightDistrict && (
                                <Layer
                                    id="region-highlight"
                                    type="fill"
                                    filter={["==", ["get", "name"], highlightDistrict]}
                                    paint={{
                                        "fill-color": "#f97316",
                                        "fill-opacity": 0.6,
                                    }}
                                />
                            )}
                        </Source>
                    )}

                    {markers.length > 0 && (
                        <Source
                            id="incident-markers"
                            type="geojson"
                            data={{
                                type: "FeatureCollection",
                                features: markers.map(m => ({
                                    type: "Feature" as const,
                                    geometry: { type: "Point" as const, coordinates: [m.lng, m.lat] },
                                    properties: { reportId: m.report_id },
                                })),
                            }}
                        >
                            <Layer
                                id="incident-dots"
                                type="circle"
                                paint={{
                                    "circle-radius": 6,
                                    "circle-color": "#ef4444",
                                    "circle-stroke-width": 2,
                                    "circle-stroke-color": "#ffffff",
                                    "circle-opacity": 0.8,
                                }}
                            />
                        </Source>
                    )}

                </Map>

                {selectedRegion && (
                    <MapRegionPopup
                        info={buildRegionInfo(selectedRegion, feedItems ?? [], allMonthScores, districtCounts)}
                        onClose={() => setSelectedRegion(null)}
                        onIncidentClick={(inc) => setPopupIncident({
                            type: inc.type,
                            location: selectedRegion,
                            description: inc.description,
                            time: new Date(inc.time).toLocaleString(),
                            mediaKey: inc.mediaKey,
                            landmarkLabel: null,
                            aiConfidence: inc.aiConfidence ?? null,
                        })}
                    />
                )}

                {!disableInteraction && availableMonths.length > 0 && (
                    <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-10 bg-background/90 backdrop-blur-md border border-border rounded-lg px-2 py-1.5 md:px-3 md:py-2 flex items-center gap-1 md:gap-2 shadow-md">
                        <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Period:</span>
                        <select
                            value={`${selectedMonth.year}-${selectedMonth.month}`}
                            onChange={(e) => {
                                const [y, m] = e.target.value.split("-").map(Number);
                                setSelectedMonth({ year: y, month: m });
                            }}
                            className="bg-transparent text-xs md:text-sm font-medium text-foreground border-none outline-none cursor-pointer"
                        >
                            {availableMonths.map(({ year, month }) => (
                                <option key={`${year}-${month}`} value={`${year}-${month}`}>
                                    {new Date(year, month - 1).toLocaleString("en", { month: "long", year: "numeric" })}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

            </div>


            <IncidentDetailsPop
                open={!!popupIncident}
                onClose={() => setPopupIncident(null)}
                incident={popupIncident}
            />
        </>
    );
}
