"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Map, { NavigationControl, Source, Layer, MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const SELANGOR_BOUNDS = [101.3, 2.85, 102.0, 3.35];

// --- DEMO DATA: TODO: replace ---
const DEMO_CRIME_DATA: Record<string, number> = {
    "Petaling Jaya": 1850,
    "Shah Alam": 1200,
    "Cyberjaya": 320,
    "Subang Jaya": 1600,
    "Majlis Bandaraya Subang Jaya": 1600,
    "Klang": 0,
    "Bandaraya Klang": 2000,
    "Sepang": 0,
    "Putrajaya": 210,
    "Gombak": 950,
    "Ampang": 870,
    "Majlis Perbandaran Ampang Jaya": 870,
    "Cheras": 790,
    "Hulu Langat": 640,
    "Majlis Perbandaran Kajang": 640,
    "Kuala Langat": 430,
    "Hulu Selangor": 310,
    "Kuala Selangor": 390,
    "Sabak Bernam": 180,
    "Majlis Perbandaran Selayang": 720,
    "Petaling": 900,
    "Ulu Kelang": 410,
    "Bandar Baru Bangi": 560,
    "Petaling Jaya Selatan": 480,
    "Pekan Bukit Kemuning": 200,
    "Bukit Beruntung": 150,
};

export default function MapView() {
    const mapRef = useRef<MapRef>(null);
    const [viewState, setViewState] = useState({ longitude: 101.68, latitude: 3.07, zoom: 10 });
    const [regionData, setRegionData] = useState<GeoJSON.FeatureCollection | null>(null);

    useEffect(() => {
        const container = mapRef.current?.getMap()?.getContainer();
        if (!container) return;
        const observer = new ResizeObserver(() => {
            mapRef.current?.getMap()?.resize();
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [regionData]);

    const handleMapLoad = useCallback(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;
        const observer = new ResizeObserver(() => map.resize());
        observer.observe(map.getContainer());
    }, []);

    useEffect(() => {
        fetch("/sel-pj-polygons.geojson")
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
                </Source>
            )}
        </Map>
    );
}