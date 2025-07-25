import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    // Mongoose handles connection pooling automatically.
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure. A retry logic could be implemented here for production.
    process.exit(1);
  }
};

export default connectDB;
