import mongoose from "mongoose";
import Player from "../models/Player.js";
import Transaction from "../models/Transaction.js";
import cryptoService from "./cryptoService.js";
import crypto from "crypto";

class WalletService {
  async placeBet(playerId, usdAmount, currency) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const player = await Player.findOne({ _id: playerId }).session(session);
      if (!player) {
        throw new Error("Player not found.");
      }

      const prices = await cryptoService.getPrices();
      console.log(`Prices from CryptoService: ${prices}`);

      const cryptoAmount = cryptoService.convertUsdToCrypto(
        usdAmount,
        currency,
        prices
      );

      const walletBalance = player.wallet[currency] || 0;
      if (walletBalance < cryptoAmount) {
        throw new Error("Insufficient funds.");
      }

      // 1. Deduct from wallet
      console.log("Wallet before deduction:", player.wallet);
      player.wallet[currency] -= cryptoAmount;
      // console.log(
      //   `Deducted ${cryptoAmount} from Wallet curr: ${player.wallet[currency]} `
      // );
      console.log("Wallet after deduction:", player.wallet);

      await player.save({ session });

      // 2. Create transaction record
      const transaction = new Transaction({
        playerId,
        usdAmount,
        cryptoAmount,
        currency,
        transactionType: "bet",
        transactionHash: crypto.randomBytes(16).toString("hex"), // Mock hash
        priceAtTime: prices[currency],
      });
      await transaction.save({ session });

      await session.commitTransaction();
      return { cryptoAmount, priceAtTime: prices[currency] };
    } catch (error) {
      await session.abortTransaction();
      console.error(
        "Bet transaction failed and was rolled back:",
        error.message
      );
      throw error; // Re-throw to be handled by the caller
    } finally {
      session.endSession();
    }
  }

  async processCashout(playerId, bet, multiplier) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const player = await Player.findOne({ _id: playerId }).session(session);
      if (!player) {
        throw new Error("Player not found.");
      }

      const winningsCrypto = bet.betAmountCrypto * multiplier;
      console.log(`WinningCrypto : ${winningsCrypto}`);

      const prices = await cryptoService.getPrices();
      const winningsUsd = winningsCrypto * prices[bet.currency];

      // 1. Add winnings to wallet
      if (!player.wallet[bet.currency]) {
        player.wallet[bet.currency] = 0;
      }

      console.log("Wallet before payout:", player.wallet);
      player.wallet[bet.currency] += winningsCrypto;
      // console.log(
      //   `Added ${winningsCrypto} to wallet curr: ${player.wallet[bet.currency]}`
      // );
      console.log("Wallet after payout:", player.wallet);

      await player.save({ session });

      // 2. Create transaction record
      const transaction = new Transaction({
        playerId,
        usdAmount: winningsUsd,
        cryptoAmount: winningsCrypto,
        currency: bet.currency,
        transactionType: "cashout",
        transactionHash: crypto.randomBytes(16).toString("hex"),
        priceAtTime: prices[bet.currency],
      });
      await transaction.save({ session });

      await session.commitTransaction();
      return { winningsCrypto, winningsUsd };
    } catch (error) {
      await session.abortTransaction();
      console.error(
        "Cashout transaction failed and was rolled back:",
        error.message
      );
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getWalletBalance(playerId) {
    const player = await Player.findById(playerId);
    if (!player) {
      throw new Error("Player not found.");
    }

    const prices = await cryptoService.getPrices();
    const walletUsdValue = Object.keys(player.wallet.toObject()).reduce(
      (total, currency) => {
        const cryptoAmount = player.wallet[currency];
        const price = prices[currency] || 0;
        return total + cryptoAmount * price;
      },
      0
    );

    return {
      wallet: player.wallet,
      totalUsdValue: walletUsdValue.toFixed(2),
    };
  }
}

export default new WalletService();
