"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Map, { NavigationControl, Source, Layer, MapRef, type MapMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import MapRegionPopup, { RegionInfo } from "./MapRegionPopup";
import { FeedItem } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import IncidentDetailsPop, { Incident } from "./IncidentDetailsPop";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const SELANGOR_BOUNDS = [101.3, 2.85, 102.0, 3.35];

// --- TODO: replace ---
const DEMO_CRIME_DATA: Record<string, number> = {
    "Petaling Jaya": 1850,
    "Shah Alam": 1200,
    "Subang Jaya": 1600,
    "Klang Utara": 0,
    "Klang Selatan": 0,
    "Sepang": 0,
    "Putrajaya": 210,
    "Gombak": 950,
    "Ampang": 870,
    "Cheras": 790,
    "Kajang": 640,
    "Serdang": 1000,
    "Brickfields": 1000,
    "Dang Wangi": 100,
    "Sentul": 10,
    "Wangsa Maju": 1
};

function buildRegionInfo(name: string, feedItems: FeedItem[]): RegionInfo {
    const districtItems = feedItems
        .filter(item => item.district === name)
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

    return {
        name,
        crimeTrend: { change: "–", direction: "up", period: "Last 7 days" }, // TODO: change
        totalReports: districtItems.length,
        latestIncidents: districtItems.slice(0, 3).map(item => ({
            type: item.type ?? "unknown",
            time: item.createdAt ? formatRelativeTime(item.createdAt) : "",
            description: item.description ?? "No description",
        })),
    };
}

interface MapViewProps {
    highlightDistrict?: string;
    disableInteraction?: boolean;
    feedItems?: FeedItem[];
}

export default function MapView({ highlightDistrict, disableInteraction, feedItems }: MapViewProps) {
    const mapRef = useRef<MapRef>(null);
    const [viewState, setViewState] = useState({ longitude: 101.68, latitude: 3.07, zoom: 10 });
    const [regionData, setRegionData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string>('grab');
    const [popupIncident, setPopupIncident] = useState<Incident | null>(null);

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
        fetch("/map.geojson")
            .then((res) => res.json())
            .then((geojson: GeoJSON.FeatureCollection) => {
                const merged = {
                    ...geojson,
                    features: geojson.features.map((f) => ({
                        ...f,
                        properties: {
                            ...f.properties,
                            crimeCount: DEMO_CRIME_DATA[f.properties?.name] ?? null,
                        },
                    })),
                };
                setRegionData(merged);
            })
            .catch(console.error);

        // TODO: merge crime counts from backend
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
                                        ["==", ["get", "crimeCount"], null],
                                        "#1f1f29",
                                        [
                                            "interpolate", ["linear"], ["get", "crimeCount"],
                                            0, "#22c55e",
                                            500, "#eab308",
                                            1000, "#f97316",
                                            2000, "#ef4444",
                                        ],
                                    ],
                                "fill-opacity": highlightDistrict ? 0.3 : 0.5,
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
            </Map>

            {selectedRegion && (
                <MapRegionPopup
                    info={buildRegionInfo(selectedRegion, feedItems ?? [])}
                    onClose={() => setSelectedRegion(null)}
                    onIncidentClick={(inc) => setPopupIncident({
                        type: inc.type,
                        location: selectedRegion,
                        description: inc.description,
                        time: inc.time,
                        mediaKey: null,
                        mediaKeys: [],
                        landmarkLabel: null,
                    })}
                />
            )}

            <IncidentDetailsPop
                open={!!popupIncident}
                onClose={() => setPopupIncident(null)}
                incident={popupIncident}
            />
        </div>
    );
}
