import mongoose from "mongoose";

const betSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    betAmountUSD: { type: Number, required: true },
    betAmountCrypto: { type: Number, required: true },
    currency: { type: String, required: true },
    cashOutMultiplier: { type: Number, default: null }, // null if crashed
    payout: Number, // null if crashed
  },
  { _id: false }
);

const gameRoundSchema = new mongoose.Schema(
  {
    roundId: { type: String, required: true, unique: true, index: true },
    serverSeed: { type: String, required: true },
    publicHash: { type: String, required: true },
    crashPoint: { type: Number, required: true },
    bets: [betSchema],
  },
  { timestamps: true }
);

const GameRound = mongoose.model("GameRound", gameRoundSchema);

export default GameRound;
