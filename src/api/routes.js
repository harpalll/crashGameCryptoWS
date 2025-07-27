import { Router } from "express";
import walletService from "../services/walletService.js";
import Player from "../models/Player.js";

// --- API Endpoints ---
export default function createRoutes(gameService) {
  const router = Router();

  router.get("/players", async (req, res, next) => {
    try {
      const players = await Player.find();

      res.status(200).json({
        success: true,
        message: "Players fetched successfully.",
        players,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route   POST /api/bet
   * @desc    Places a bet for a player
   * @access  Public
   * @body    { "playerId": "...", "usdAmount": 10, "currency": "BTC" }
   */
  router.post("/bet", async (req, res, next) => {
    try {
      const { playerId, usdAmount, currency } = req.body;

      if (!playerId || !usdAmount || !currency) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields." });
      }

      // Note: This is now being handled via WebSockets for real-time interaction
      await gameService.handleBetPlacement(playerId, usdAmount, currency);

      res.status(200).json({
        success: true,
        message: "Bet received and is being processed.",
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route   GET /api/game-state/:playerId
   * @desc    Gets the current game state and player's balance
   * @access  Public
   */
  router.get("/game-state/:playerId", async (req, res, next) => {
    try {
      const { playerId } = req.params;
      const gameState = gameService.getGameState();
      const walletState = await walletService.getWalletBalance(playerId);

      res.status(200).json({
        success: true,
        data: {
          ...gameState,
          wallet: walletState,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // --- Standardized Error Handler ---
  router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: err.message || "An unexpected error occurred.",
    });
  });

  return router;
}
