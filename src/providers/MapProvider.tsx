"use client";

import { Libraries, useJsApiLoader } from "@react-google-maps/api";
import { ReactNode } from "react";

const libraries: Libraries = ["places", "marker"];

export function MapProvider({ children }: { children: ReactNode }) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries: libraries,
    });

    if (loadError) return <p>Erreur de chargement de Google Maps</p>;
    if (!isLoaded) return <p>Chargement de la carte...</p>;

    return children;
}
