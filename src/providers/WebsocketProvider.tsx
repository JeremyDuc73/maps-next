"use client"

import { createContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

interface WebSocketContextType {
    userCount: number;
    positions: Array<{lat: number; lng: number}>;
    activeRoutes: Array<{ userId: string, steps: Array<{ lat: number; lng: number }> }>;
    sendRoute: (steps: Array<{ lat: number; lng: number }>) => void;
}

export const WebSocketContext = createContext<WebSocketContextType>({
    userCount: 0,
    positions: [],
    activeRoutes: [],
    sendRoute: () => {}
});

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [userCount, setUserCount] = useState(0);
    const [positions, setPositions] = useState<Array<{lat: number; lng: number}>>([]);
    const [activeRoutes, setActiveRoutes] = useState<Array<{ userId: string, steps: Array<{ lat: number; lng: number }> }>>([]);

    useEffect(() => {
        const newSocket = io(":45009");
        setSocket(newSocket);

        newSocket.on("initialData", (data) => {
            setUserCount(data.userCount);
            setPositions(data.positions);
            setActiveRoutes(data.activeRoutes || []);
        });

        newSocket.on("updatePositions", (data) => {
            setPositions(data);
        });

        newSocket.on("updateRoutes", (routes) => {
            setActiveRoutes(routes);
        });

        if ("geolocation" in navigator) {
            const updateLocation = (position: GeolocationPosition) => {
                const userPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                newSocket.emit("updateLocation", userPosition);
            };

            navigator.geolocation.getCurrentPosition(updateLocation, console.error);
            const watchId = navigator.geolocation.watchPosition(updateLocation, console.error);

            return () => navigator.geolocation.clearWatch(watchId);
        }

        return () => {
            newSocket.off("initialData");
            newSocket.off("updatePositions");
            newSocket.off("updateRoutes");
            newSocket.disconnect();
        };
    }, []);

    const sendRoute = (steps: Array<{ lat: number; lng: number }>) => {
        if (socket) {
            socket.emit("shareRoute", steps);
        }
    };

    return (
        <WebSocketContext.Provider value={{ userCount, positions, activeRoutes, sendRoute }}>
            {children}
        </WebSocketContext.Provider>
    );
};
