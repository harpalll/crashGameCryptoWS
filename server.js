import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose"; // you missed importing this
import createRoutes from "./src/api/routes.js";
import path from "path";
import { fileURLToPath } from "url";
import { sendWallet } from "./src/utils/getWalletForPlayer.js";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB:", conn.connection.name);

    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.static(path.join(__dirname, "public")));

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Lazy-load gameService AFTER MongoDB is connected
    const { default: GameService } = await import(
      "./src/services/gameService.js"
    );
    const gameService = new GameService(io);

    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    });

    app.use("/api", createRoutes(gameService)); // Inject game service

    // --- WebSocket ---
    io.on("connection", (socket) => {
      console.log(`A user connected: ${socket.id}`);

      const playerId = socket.handshake.query.playerId;
      socket.playerId = playerId;

      if (!playerId) {
        console.log(`Connection rejected: No playerId provided.`);
        return socket.disconnect();
      }

      sendWallet(socket);
      socket.join(playerId);

      socket.on("player:bet", async (data) => {
        try {
          if (!data || !data.usdAmount || !data.currency) {
            throw new Error("Invalid bet data provided.");
          }

          await gameService.handleBetPlacement(
            playerId,
            data.usdAmount,
            data.currency
          );

          socket.emit("player:bet_success", {
            message: "Bet placed successfully!",
          });
        } catch (error) {
          console.error(`Bet error for player ${playerId}:`, error.message);
          socket.emit("error:bet", { message: error.message });
        }
      });

      socket.on("player:cashout", async () => {
        try {
          await gameService.handleCashOut(playerId);
        } catch (error) {
          console.error(`Cashout error for player ${playerId}:`, error.message);
          socket.emit("error:cashout", { message: error.message });
        }
      });

      socket.on("player:wallet", async () => {
        sendWallet(socket);
      });

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${playerId} (${socket.id})`);
      });
    });

    server.listen(PORT, () => {
      console.log(`🚀 Server is listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();
