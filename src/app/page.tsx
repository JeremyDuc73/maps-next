"use client";

import { useState, useEffect } from "react";
import { MapProvider } from "@/providers/MapProvider";
import { Map } from "@/components/Map";
import { SearchBox } from "@/components/SearchBox";
import { RoutePlanner } from "@/components/RoutePlanner";

export default function Home() {
    const [origin, setOrigin] = useState<google.maps.LatLngLiteral | null>(null);
    const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
    const [showRoute, setShowRoute] = useState(false);
    const [userAddress, setUserAddress] = useState<string>("Chargement...");

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setOrigin(userLocation);

            // Obtenir l'adresse de la position actuelle
            fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${userLocation.lng}&lat=${userLocation.lat}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.features.length > 0) {
                        setUserAddress(data.features[0].properties.label);
                    }
                });
        });
    }, []);

    return (
        <MapProvider>
            <div className="flex flex-col items-center gap-4 p-4">
                <p className="font-bold">Départ : {userAddress}</p>
                <SearchBox onSelect={(location) => setDestination(location)} />
                <button
                    className="p-2 bg-blue-500 text-white rounded"
                    onClick={() => setShowRoute(true)}
                    disabled={!destination}
                >
                    Afficher l'itinéraire
                </button>
                <Map origin={origin} destination={destination} />
                {showRoute && <RoutePlanner origin={origin} destination={destination} showRoute={showRoute} />}
            </div>
        </MapProvider>
    );
}
