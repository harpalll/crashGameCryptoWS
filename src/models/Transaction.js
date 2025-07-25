import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
      index: true,
    },
    roundId: {
      type: String,
    },
    usdAmount: { type: Number, required: true },
    cryptoAmount: { type: Number, required: true },
    currency: { type: String, required: true },
    transactionType: {
      type: String,
      enum: ["bet", "cashout"],
      required: true,
    },
    // This is a mock hash as we are not using a real blockchain
    transactionHash: {
      type: String,
      required: true,
      unique: true,
    },
    priceAtTime: { type: Number, required: true }, // Price of crypto in USD
    status: {
      type: String,
      enum: ["completed", "pending", "failed"],
    },
  },
  {
    timestamps: true,
    // Make records immutable after creation
    pre: function (next) {
      if (!this.isNew) {
        this.invalidate();
      }
      next();
    },
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
