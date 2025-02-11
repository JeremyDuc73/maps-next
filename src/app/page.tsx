"use client";

import { useState, useEffect } from "react";
import io from "socket.io-client";
import { useJsApiLoader } from "@react-google-maps/api";
import { MapProvider } from "@/providers/MapProvider";
import { Map } from "@/components/Map";
import { SearchBox } from "@/components/SearchBox";
import { RoutePlanner } from "@/components/RoutePlanner";

const socket = io("http://localhost:4000");

export default function Home() {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries: ["places", "marker"],
    });

    interface User {
        id: string;
        name: string;
        location: google.maps.LatLngLiteral;
        color: string;
    }

    // ✅ Ajout des variables manquantes
    const [name, setName] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [origin, setOrigin] = useState<google.maps.LatLngLiteral | null>(null); // 🔹 Ajout
    const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null); // 🔹 Ajout
    const [map, setMap] = useState<google.maps.Map | null>(null); // 🔹 Ajout
    const [steps, setSteps] = useState<{ id: string; location: google.maps.LatLngLiteral; name: string }[]>([]);

    useEffect(() => {
        if (!isLoaded || !window.google) return;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation: google.maps.LatLngLiteral = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setOrigin(userLocation);
            },
            (error) => console.error("Erreur de géolocalisation :", error),
            { enableHighAccuracy: true }
        );

        socket.on("updateUsers", (usersList) => {
            setUsers(usersList);
        });

        return () => {
            socket.disconnect();
        };
    }, [isLoaded]);

    const handleJoin = () => {
        if (name && origin) {
            socket.emit("join", name, origin);
        }
    };

    return (
        <MapProvider>
            <div className="flex flex-col items-center gap-4 p-4">
                {!name ? (
                    <>
                        <p>Entrez votre nom :</p>
                        <input
                            type="text"
                            placeholder="Votre nom"
                            onChange={(e) => setName(e.target.value)}
                            className="border p-2 rounded"
                        />
                        <button className="bg-blue-500 text-white p-2 rounded" onClick={handleJoin}>
                            Rejoindre la carte
                        </button>
                    </>
                ) : (
                    <>
                        <p className="font-bold">Bienvenue, {name} !</p>
                        <p>Utilisateurs connectés :</p>
                        <select onChange={(e) => setSelectedUser(e.target.value)} className="border p-2 rounded">
                            <option value="">Sélectionnez un utilisateur</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.location.lat.toFixed(4)}, {user.location.lng.toFixed(4)})
                                </option>
                            ))}
                        </select>

                        <SearchBox onSelect={(location) => setDestination(location)} />

                        <Map
                            users={users}
                            origin={origin}
                            destination={destination}
                            waypoints={steps.map((step) => ({ location: step.location, stopover: true }))}
                            onMapLoad={setMap}
                        />

                        {destination && (
                            <RoutePlanner
                                origin={origin}
                                destination={destination}
                                waypoints={steps.map((step) => ({ location: step.location, stopover: true }))}
                                map={map}
                                onDurationUpdate={() => {}}
                            />
                        )}
                    </>
                )}
            </div>
        </MapProvider>
    );
}
