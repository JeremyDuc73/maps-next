import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});

interface User {
    id: string;
    name: string;
    location: { lat: number; lng: number };
    color: string;
}

const users: Record<string, User> = {};
const routes: Record<string, any> = {};

io.on("connection", (socket: Socket) => {
    console.log("Nouvelle connexion : ", socket.id)

    socket.on("join", (name: string, location : {lat: number, lng: number}) => {
        const userid = uuidv4();
        const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        users[socket.id] = { id: userid, name, location, color };
        io.emit("updateUsers", Object.values(users))
    })

    socket.on("updateLocation", (location: {lat: number, lng: number}) => {
        if (users[socket.id]) {
            users[socket.id].location = location;
            io.emit("updateUsers", Object.values(users))
        }
    })

    socket.on("shareRoute", (route) => {
        routes[socket.id] = route;
        io.emit("updateRoutes", Object.values(routes))
    })

    socket.on("disconnect", () => {
        console.log("Utilisateur déconnecté : ", socket.id)
        delete users[socket.id];
        delete routes[socket.id];
        io.emit("updateUsers", Object.values(users))
        io.emit("updateRoutes", Object.values(routes))
    })
})

httpServer.listen(4000, () => {
    console.log("Serveur Websocket en écoute sur le port 4000")
})