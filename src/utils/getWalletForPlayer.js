import Player from "../models/Player.js";

const getWalletForPlayer = async (playerId) => {
  try {
    const player = await Player.findById(playerId);

    if (!player) {
      console.warn(`Player not found: ${playerId}`);
      return null;
    }

    return player.wallet;
  } catch (err) {
    console.error("Error fetching wallet:", err);
    return null;
  }
};

export const sendWallet = async (socket) => {
  try {
    // if socket.playerId is not reaching here then send playerId from server.js
    const wallet = await getWalletForPlayer(socket.playerId);
    if (wallet) {
      socket.emit("player:wallet", wallet);
    } else {
      socket.emit("player:wallet", { error: "Wallet not found" });
    }
  } catch (err) {
    socket.emit("player:wallet", { error: "Error fetching wallet" });
  }
};
