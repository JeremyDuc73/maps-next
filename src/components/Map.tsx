"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleMap } from "@react-google-maps/api";
import io from "socket.io-client";

const mapContainerStyle = { width: "100%", height: "70vh" };
const defaultMapOptions = {
    zoomControl: true,
    mapTypeId: "roadmap",
    mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
};

interface User {
    id: string;
    name: string;
    location: google.maps.LatLngLiteral;
    color: string;
}

interface MapProps {
    origin: google.maps.LatLngLiteral | null;
    destination: google.maps.LatLngLiteral | null;
    waypoints?: google.maps.DirectionsWaypoint[];
    onMapLoad: (map: google.maps.Map) => void;
    users: User[];
}


// Connexion WebSocket
const socket = io("http://localhost:4000");

const Map = ({ origin, destination, waypoints = [], onMapLoad }: MapProps) => {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        if (!map || !window.google || !window.google.maps.marker) return;

        const { AdvancedMarkerElement } = window.google.maps.marker;

        // 🔹 Supprimer les anciens marqueurs pour éviter les doublons
        markersRef.current.forEach((marker) => {
            marker.map = null;
        });
        markersRef.current = [];

        // 🔹 Ajouter le marqueur du point de départ
        if (origin) {
            const originMarker = new AdvancedMarkerElement({ position: origin, map, title: "Départ" });
            markersRef.current.push(originMarker);
        }

        // 🔹 Ajouter le marqueur de la destination
        if (destination) {
            const destinationMarker = new AdvancedMarkerElement({ position: destination, map, title: "Arrivée" });
            markersRef.current.push(destinationMarker);
        }

        // 🔹 Ajouter les marqueurs des étapes intermédiaires
        waypoints.forEach((wp, index) => {
            const waypointMarker = new AdvancedMarkerElement({
                position: wp.location as google.maps.LatLngLiteral,
                map,
                title: `Étape ${index + 1}`,
            });
            markersRef.current.push(waypointMarker);
        });

        // 🔹 Ajouter les marqueurs des utilisateurs connectés
        users.forEach((user) => {
            const userMarker = new AdvancedMarkerElement({
                position: user.location,
                map,
                title: user.name,
            });

            // 🔹 Création d'un élément HTML DOM pour afficher le nom avec la couleur
            const label = document.createElement("div");
            label.style.color = user.color;
            label.style.fontWeight = "bold";
            label.style.textAlign = "center";
            label.style.padding = "5px";
            label.style.background = "white";
            label.style.borderRadius = "5px";
            label.style.boxShadow = "0px 0px 5px rgba(0,0,0,0.3)";
            label.innerText = user.name;

            userMarker.content = label; // 🔹 Affectation du DOM Node

            markersRef.current.push(userMarker);
        });

    }, [map, origin, destination, waypoints, users]);

    // 🔹 Gestion des WebSockets pour suivre les utilisateurs en temps réel
    useEffect(() => {
        socket.on("updateUsers", (usersList: User[]) => {
            setUsers(usersList);
        });

        return () => {
            socket.off("updateUsers");
        };
    }, []);

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={origin || { lat: 48.8566, lng: 2.3522 }}
            zoom={origin ? 14 : 12}
            options={defaultMapOptions}
            onLoad={(loadedMap) => {
                setMap(loadedMap);
                onMapLoad(loadedMap);
            }}
        />
    );
};

export { Map };
