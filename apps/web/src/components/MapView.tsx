"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Map, { NavigationControl, Source, Layer, MapRef, type MapMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import MapRegionPopup, { RegionInfo } from "./MapRegionPopup";

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

const DEMO_REGION_INFO: Record<string, RegionInfo> = {
    "Petaling Jaya": {
        name: "Petaling Jaya",
        crimeTrend: { change: "12%", direction: "up", period: "Last 7 days" },
        latestIncident: { title: "House Break-in", time: "2h ago", description: "Reported break-in at SS2 residential area." }
    },
    "Shah Alam": {
        name: "Shah Alam",
        crimeTrend: { change: "5%", direction: "down", period: "Last 7 days" },
        latestIncident: { title: "Vandalism", time: "5h ago", description: "Graffiti found on public property in Section 14." }
    },
    "Subang Jaya": {
        name: "Subang Jaya",
        crimeTrend: { change: "8%", direction: "up", period: "Last 7 days" },
        latestIncident: { title: "Snatch Theft", time: "1d ago", description: "Pedestrian handbag snatched near LRT station." }
    }
};

const getDefaultRegionInfo = (name: string): RegionInfo => ({
    name,
    crimeTrend: { change: "2%", direction: "up", period: "Last 7 days" },
    latestIncident: null
});

export default function MapView() {
    const mapRef = useRef<MapRef>(null);
    const [viewState, setViewState] = useState({ longitude: 101.68, latitude: 3.07, zoom: 10 });
    const [regionData, setRegionData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string>('grab');

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
                interactiveLayerIds={regionData ? ["region-fill"] : undefined}
                onClick={handleMapClick}
                cursor={cursor}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <NavigationControl position="top-right" />

                {regionData && (
                    <Source id="region-zones" type="geojson" data={regionData}>
                        <Layer
                            id="region-fill"
                            type="fill"
                            paint={{
                                "fill-color": [
                                    "case",
                                    ["==", ["get", "crimeCount"], null],
                                    "#1f1f29", // no data yet
                                    [
                                        "interpolate", ["linear"], ["get", "crimeCount"],
                                        0, "#22c55e",
                                        500, "#eab308",
                                        1000, "#f97316",
                                        2000, "#ef4444",
                                    ],
                                ],
                                "fill-opacity": 0.5,
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
                    </Source>
                )}
            </Map>

            {selectedRegion && (
                <MapRegionPopup
                    info={DEMO_REGION_INFO[selectedRegion] || getDefaultRegionInfo(selectedRegion)}
                    onClose={() => setSelectedRegion(null)}
                />
            )}
        </div>
    );
}
