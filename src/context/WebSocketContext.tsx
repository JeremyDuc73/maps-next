"use client"

import { createContext, useContext } from "react";

interface WebSocketContextType {
    userCount: number;
    positions: Array<{lat: number; lng: number}>;
}

export const WebSocketContext = createContext<WebSocketContextType>({
    userCount: 0,
    positions: []
})

export const useWebSocket = () => {
    const context = useContext(WebSocketContext)
    if (!context) {
        throw new Error("useWebSocket must be used within a WebSocketProvider")
    }
    return context
}