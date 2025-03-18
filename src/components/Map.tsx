"use client";

import {useContext, useEffect, useRef, useState} from "react";
import { WebSocketContext } from "@/providers/WebsocketProvider";
import {GoogleMap, Marker} from "@react-google-maps/api";

const mapContainerStyle = { width: "100%", height: "70vh" };
const defaultMapOptions = {
    zoomControl: true,
    mapTypeId: "roadmap",
    mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
};

interface MapProps {
    origin: google.maps.LatLngLiteral | null;
    destination: google.maps.LatLngLiteral | null;
    waypoints?: google.maps.DirectionsWaypoint[];
    onMapLoad: (map: google.maps.Map) => void;
}

const Map = ({ origin, destination, waypoints = [], onMapLoad }: MapProps) => {
    const { positions, activeRoutes } = useContext(WebSocketContext);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]); // 🔹 Stocke les marqueurs sans déclencher de re-rendu

    useEffect(() => {
        if (!map || !window.google || !window.google.maps.marker) return;

        const { AdvancedMarkerElement } = window.google.maps.marker;

        markersRef.current.forEach((marker) => {
            marker.map = null;
        });
        markersRef.current = [];

        if (origin) {
            const originMarker = new AdvancedMarkerElement({ position: origin, map, title: "Départ" });
            markersRef.current.push(originMarker);
        }
        if (destination) {
            const destinationMarker = new AdvancedMarkerElement({ position: destination, map, title: "Arrivée" });
            markersRef.current.push(destinationMarker);
        }
        waypoints.forEach((wp, index) => {
            const waypointMarker = new AdvancedMarkerElement({
                position: wp.location as google.maps.LatLngLiteral,
                map,
                title: `Étape ${index + 1}`,
            });
            markersRef.current.push(waypointMarker);
        });

    }, [map, origin, destination, waypoints]);

    return (
        <>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={origin || {lat: 48.8566, lng: 2.3522}}
                zoom={origin ? 14 : 12}
                options={defaultMapOptions}
                onLoad={(loadedMap) => {
                    setMap(loadedMap);
                    onMapLoad(loadedMap);
                }}
            >
                {origin && <Marker position={origin} label="D" />}
                {destination && <Marker position={destination} label="A" />}
                {waypoints.map((wp, index) => {
                    const position = wp.location as google.maps.LatLngLiteral | undefined;
                    return position ? <Marker key={index} position={position} label={`${index + 1}`} /> : null;
                })}
                {positions.map((pos, index) => (
                    <Marker key={index} position={pos} label={`U${index + 1}`} />
                ))}
                {activeRoutes.map((route, index) =>
                    route.steps.map((step, stepIndex) => (
                        <Marker key={`${index}-${stepIndex}`} position={step} label={`R${index + 1}`} />
                    ))
                )}
            </GoogleMap>
        </>
    );
};

export { Map };
