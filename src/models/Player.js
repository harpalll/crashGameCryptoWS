import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    BTC: { type: Number, default: 0, min: 0 },
    ETH: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const playerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    wallet: {
      type: walletSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const Player = mongoose.model("Player", playerSchema);

export default Player;
