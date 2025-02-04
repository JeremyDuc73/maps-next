"use client";

import { useEffect, useState } from "react";
import { DirectionsRenderer, DirectionsService } from "@react-google-maps/api";

interface RoutePlannerProps {
    origin: google.maps.LatLngLiteral | null;
    destination: google.maps.LatLngLiteral | null;
    showRoute: boolean;
}

const RoutePlanner = ({ origin, destination, showRoute }: RoutePlannerProps) => {
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

    useEffect(() => {
        if (!origin || !destination || !showRoute) return;

        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
            {
                origin,
                destination,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    setDirections(result);
                } else {
                    console.error("Erreur Directions API:", status);
                }
            }
        );
    }, [origin, destination, showRoute]);

    return directions ? <DirectionsRenderer directions={directions} /> : null;
};

export { RoutePlanner };
