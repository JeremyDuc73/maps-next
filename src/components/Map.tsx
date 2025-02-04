"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";
import { useEffect, useState } from "react";

const mapContainerStyle = { width: "100%", height: "70vh" };
const defaultMapOptions = { zoomControl: true, mapTypeId: "roadmap" };

interface MapProps {
    origin: google.maps.LatLngLiteral | null;
    destination: google.maps.LatLngLiteral | null;
}

const Map = ({ origin, destination }: MapProps) => {
    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={origin || { lat: 48.8566, lng: 2.3522 }}
            zoom={origin ? 14 : 12}
            options={defaultMapOptions}
        >
            {origin && <Marker position={origin} label="Départ" />}
            {destination && <Marker position={destination} label="Arrivée" />}
        </GoogleMap>
    );
};

export { Map };
