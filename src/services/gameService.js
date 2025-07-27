import crypto from "crypto";
import GameRound from "../models/GameRound.js";
import walletService from "./walletService.js";

const GAME_STATE = {
  WAITING: "WAITING",
  BETTING: "BETTING",
  IN_PROGRESS: "IN_PROGRESS",
  CRASHED: "CRASHED",
};

const BETTING_DURATION = 10000;
const WAITING_DURATION = 5000;
const maxRoundDuration = 60000; // 60 seconds
// const roundId = await GameRound.findOne()
//   .sort({ roundId: -1 })
//   .select("roundId");

class GameService {
  constructor(io) {
    this.io = io;
    this.state = GAME_STATE.WAITING;
    this.roundId = 0;
    this.serverSeed = null;
    this.publicHash = null;
    this.crashPoint = null;
    this.multiplier = 1.0;
    this.startTime = null;
    this.bets = new Map();

    this._gameLoop();
  }

  async _gameLoop() {
    while (true) {
      this.state = GAME_STATE.BETTING;
      this.io.emit("game:state", {
        state: this.state,
        duration: BETTING_DURATION,
      });
      console.log("--- Betting phase started ---");
      await this._sleep(BETTING_DURATION);

      this.state = GAME_STATE.IN_PROGRESS;
      console.log("--- Starting Round ---");
      await this._startRound();
      this.io.emit("game:state", {
        state: this.state,
        roundId: this.roundId,
        publicHash: this.publicHash,
      });
      console.log(`--- Round ${this.roundId} started ---`);
      await this._runMultiplier();

      this.state = GAME_STATE.CRASHED;
      this.io.emit("game:crash", {
        crashPoint: this.crashPoint,
        serverSeed: this.serverSeed,
      });
      console.log(`--- Round crashed at ${this.crashPoint}x ---`);
      await this._saveRound();

      this.state = GAME_STATE.WAITING;
      this.io.emit("game:state", {
        state: this.state,
        duration: WAITING_DURATION,
      });
      await this._sleep(WAITING_DURATION);
    }
  }

  async _startRound() {
    console.log("game round started");

    // this.roundId++;
    this.roundId = await this._getNextRoundId();

    console.log(`RoundId: ${this.roundId}`);

    this.serverSeed = crypto.randomBytes(32).toString("hex");
    this.publicHash = crypto
      .createHash("sha256")
      .update(this.serverSeed)
      .digest("hex");
    this.crashPoint = this._calculateCrashPoint();
    this.multiplier = 1.0;
    this.startTime = Date.now();
  }

  async _getNextRoundId() {
    const lastRound = await GameRound.findOne().sort({ roundId: -1 });
    return lastRound ? lastRound.roundId + 1 : 1;
  }

  // _runMultiplier() {
  //   return new Promise((resolve) => {
  //     const interval = setInterval(() => {
  //       const elapsed = Date.now() - this.startTime;
  //       this.multiplier = Math.pow(1.00006, elapsed).toFixed(2);
  //       if (this.multiplier >= this.crashPoint) {
  //         clearInterval(interval);
  //         resolve();
  //       } else {
  //         this.io.emit("multiplier:update", { multiplier: this.multiplier });
  //       }
  //     }, 100);
  //   });
  // }
  _runMultiplier() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - this.startTime;
        this.multiplier = Math.pow(1.00006, elapsed).toFixed(2);

        if (this.multiplier >= this.crashPoint) {
          clearInterval(interval);
          clearTimeout(forceCrash);
          resolve();
        } else {
          this.io.emit("multiplier:update", { multiplier: this.multiplier });
        }
      }, 100);

      const forceCrash = setTimeout(() => {
        clearInterval(interval);
        this.crashPoint = this.multiplier;
        console.log("--- Forced crash at 60s timeout ---");
        resolve();
      }, 60000); // 60 seconds
    });
  }

  async _saveRound() {
    const roundBets = Array.from(this.bets.values());
    const gameRound = new GameRound({
      roundId: this.roundId,
      serverSeed: this.serverSeed,
      publicHash: this.publicHash,
      crashPoint: this.crashPoint,
      bets: roundBets,
    });
    await gameRound.save();
    this.bets.clear();
  }

  _calculateCrashPoint() {
    const hmac = crypto.createHmac("sha256", this.serverSeed);
    hmac.update(this.roundId.toString());
    const hash = hmac.digest("hex");
    const hex = hash.substring(0, 8);
    const int = parseInt(hex, 16);
    const crashPoint = Math.max(
      1,
      Math.floor(100 * (Math.pow(2, 32) / (int + 1))) / 100
    );
    return crashPoint;
  }

  async handleBetPlacement(playerId, usdAmount, currency) {
    if (this.state !== GAME_STATE.BETTING)
      throw new Error("Betting is closed for this round.");
    if (this.bets.has(playerId))
      throw new Error("You have already placed a bet in this round.");

    const { cryptoAmount } = await walletService.placeBet(
      playerId,
      usdAmount,
      currency
    );

    console.log(`CryptoAmount: ${cryptoAmount}`);

    this.bets.set(playerId, {
      playerId,
      betAmountUSD: usdAmount,
      betAmountCrypto: cryptoAmount,
      currency,
      cashOutMultiplier: null,
    });

    this.io.emit("player:bet_placed", { playerId, usdAmount, currency });
  }

  async handleCashOut(playerId) {
    if (this.state !== GAME_STATE.IN_PROGRESS)
      throw new Error("Cannot cash out now.");

    const bet = this.bets.get(playerId);
    if (!bet || bet.cashOutMultiplier)
      throw new Error("No active bet or already cashed out.");

    const cashOutMultiplier = this.multiplier;
    bet.cashOutMultiplier = cashOutMultiplier;
    this.bets.set(playerId, bet);

    const { winningsUsd } = await walletService.processCashout(
      playerId,
      bet,
      cashOutMultiplier
    );

    this.io
      .to(playerId)
      .emit("player:cashed_out_success", { cashOutMultiplier, winningsUsd });

    this.io.emit("player:cashed_out", {
      playerId,
      cashOutMultiplier,
      winningsUsd,
    });
  }

  getGameState() {
    return {
      state: this.state,
      roundId: this.roundId,
      multiplier: this.multiplier,
      publicHash: this.publicHash,
    };
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default GameService;
