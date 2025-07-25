import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./src/config/database.js";
import createRoutes from "./src/api/routes.js";
import GameService from "./src/services/gameService.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

await connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const gameService = new GameService(io);

// redner ui
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Use the API routes
app.use("/api", createRoutes(gameService)); // injecting game service

// --- WebSocket Connection & Event Handling ---
io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // We'll use a query parameter for this simulation.
  const playerId = socket.handshake.query.playerId;
  if (!playerId) {
    console.log(`Connection rejected: No playerId provided.`);
    return socket.disconnect();
  }

  // Join a private room for this player to send them specific notifications
  socket.join(playerId);

  // --- Bet Placement Handling ---
  socket.on("player:bet", async (data) => {
    try {
      // Basic validation
      if (!data || !data.usdAmount || !data.currency) {
        throw new Error("Invalid bet data provided.");
      }
      await gameService.handleBetPlacement(
        playerId,
        data.usdAmount,
        data.currency
      );
      // Notify only the player who placed the bet of success
      socket.emit("player:bet_success", {
        message: "Bet placed successfully!",
      });
    } catch (error) {
      console.error(`Bet error for player ${playerId}:`, error.message);
      // Notify only the player of the error
      socket.emit("error:bet", { message: error.message });
    }
  });

  // --- Cashout Handling ---
  socket.on("player:cashout", async () => {
    try {
      await gameService.handleCashOut(playerId);
      // Success message is sent from within the game service to the player's room
    } catch (error) {
      console.error(`Cashout error for player ${playerId}:`, error.message);
      socket.emit("error:cashout", { message: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${playerId} (${socket.id})`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

export { io, server };
