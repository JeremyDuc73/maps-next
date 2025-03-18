"use client";

import {useState, useEffect, useContext} from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { MapProvider } from "@/providers/MapProvider";
import { Map } from "@/components/Map";
import { SearchBox } from "@/components/SearchBox";
import { RoutePlanner } from "@/components/RoutePlanner";
import SortableItem from "@/components/SortableItem";
import {WebSocketContext} from "@/providers/WebsocketProvider";
import type {DragEndEvent} from "@dnd-kit/core/dist/types";

export default function Home() {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries: ["places", "marker"],
    });

    const { userCount, activeRoutes, sendRoute } = useContext(WebSocketContext);
    const [origin, setOrigin] = useState<google.maps.LatLngLiteral | null>(null);
    const [originAddress, setOriginAddress] = useState<string>("Localisation en cours...");
    const [steps, setSteps] = useState<{ id: string; location: google.maps.LatLngLiteral; name: string }[]>([]);
    const [showRoute, setShowRoute] = useState(false);
    const [mapKey, setMapKey] = useState<string>(crypto.randomUUID());
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [travelTime, setTravelTime] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded || !window.google) return;

        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setOrigin(userLocation);

            // 🔹 Vérifier si Geocoder est disponible avant de l'utiliser
            if (google.maps.Geocoder) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: userLocation }, (results, status) => {
                    if (status === "OK" && results && results.length > 0) {
                        setOriginAddress(results[0].formatted_address);
                    } else {
                        setOriginAddress("Adresse inconnue");
                    }
                });
            } else {
                setOriginAddress("Impossible de récupérer l'adresse.");
            }
        });
    }, [isLoaded]);

    // 🔹 Ajouter une nouvelle adresse lorsqu'on appuie sur Entrée
    const addStep = (location: google.maps.LatLngLiteral, name: string) => {
        setSteps((prevSteps) => [...prevSteps, { id: crypto.randomUUID(), location, name }]);
        setShowRoute(false);
        reloadMap();
    };

    // 🔹 Supprimer une étape
    const removeStep = (id: string) => {
        setSteps((prevSteps) => prevSteps.filter((step) => step.id !== id));
        setShowRoute(false);
        reloadMap();
    };

    // 🔹 Réorganiser les étapes

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = steps.findIndex((step) => step.id === active.id);
        const newIndex = steps.findIndex((step) => step.id === over.id);

        setSteps((prevSteps) => arrayMove(prevSteps, oldIndex, newIndex));
        setShowRoute(false);
        reloadMap();
    };

    // 🔹 Réinitialiser tout
    const resetRoute = () => {
        setSteps([]);
        setShowRoute(false);
        setTravelTime(null);
        reloadMap();
    };

    // 🔹 Recharger la carte
    const reloadMap = () => {
        setMapKey(crypto.randomUUID());
    };

    if (!isLoaded) {
        return <p>Chargement de Google Maps...</p>; // 🔹 Empêcher l'affichage si l'API n'est pas prête
    }

    const handleShowRoute = () => {
        if (steps.length > 0) {
            setShowRoute(true);
            sendRoute(steps.map((s) => s.location)); // Partager l'itinéraire avec les autres utilisateurs
        }
    };

    return (
        <MapProvider>
            <div className="flex flex-col items-center gap-4 p-4">
                <p className="font-bold">
                    Départ : {originAddress}
                </p>

                <span className="text-white">
                    Nombre d&apos;utilisateurs : {userCount}
                </span>

                {/* 🔹 Input pour ajouter une adresse */}
                <SearchBox onSelect={(location, name) => addStep(location, name)}/>

                {/* 🔹 Liste des étapes avec Drag & Drop */}
                <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={steps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
                        <ul className="w-full p-4 rounded-lg">
                            {steps.map((step) => (
                                <SortableItem key={step.id} id={step.id} name={step.name}
                                              onRemove={() => removeStep(step.id)}/>
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>

                <div className="flex gap-4">
                    <button
                        className="p-2 bg-blue-500 text-white rounded"
                        onClick={handleShowRoute}
                        disabled={steps.length < 1}
                    >
                        Afficher l&apos;itinéraire
                    </button>

                    <button className="p-2 bg-red-500 text-white rounded" onClick={resetRoute}>
                        Réinitialiser
                    </button>
                </div>

                {travelTime && <p className="text-lg font-semibold mt-2">Temps estimé : {travelTime}</p>}

                {activeRoutes.map((route, index) => (
                    <div key={index} className="border p-2 rounded bg-gray-800 text-white">
                        <p>Itinéraire partagé par l&apos;utilisateur {index + 1} :</p>
                        <ul>
                            {route.steps.map((step, stepIndex) => (
                                <li key={stepIndex}>Étape {stepIndex + 1} : {step.lat}, {step.lng}</li>
                            ))}
                        </ul>
                    </div>
                ))}

                <Map
                    key={mapKey}
                    origin={origin}
                    destination={steps.length > 0 ? steps[steps.length - 1].location : null}
                    waypoints={steps.slice(0, -1).map((s) => ({location: s.location, stopover: true}))}
                    onMapLoad={setMap}
                />

                {showRoute && steps.length > 0 && (
                    <RoutePlanner
                        origin={origin}
                        destination={steps[steps.length - 1].location}
                        waypoints={steps.slice(0, -1).map((s) => ({location: s.location, stopover: true}))}
                        map={map}
                        onDurationUpdate={setTravelTime}
                    />
                )}
            </div>
        </MapProvider>
    );
}
