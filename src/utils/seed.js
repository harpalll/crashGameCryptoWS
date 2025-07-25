import mongoose from "mongoose";
import dotenv from "dotenv";
import Player from "../models/Player.js";
import connectDB from "../config/database.js";

dotenv.config();

const seedDB = async () => {
  try {
    await connectDB();

    // Clear existing player data
    await Player.deleteMany({});
    console.log("Previous player data cleared.");

    // Create sample players
    const players = [
      { username: "PlayerOne", wallet: { BTC: 0.5, ETH: 10 } },
      { username: "PlayerTwo", wallet: { BTC: 0.2, ETH: 5 } },
      { username: "PlayerThree", wallet: { BTC: 1.0, ETH: 2 } },
    ];

    const createdPlayers = await Player.insertMany(players);
    console.log("Sample players created successfully:");
    console.log(createdPlayers);
  } catch (error) {
    console.error("Error seeding the database:", error);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
    process.exit();
  }
};

seedDB();
