import dns from "node:dns";
import mongoose from "mongoose";
import dotenv from "dotenv";

dns.setDefaultResultOrder("ipv4first");
dotenv.config();

export const connectToDb = async (): Promise<void> => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error("MONGO_URL is not defined");
    }
    await mongoose.connect(mongoUrl, { family: 4 });
    console.log("Connected to DB");
  } catch (error) {
    console.error("Database connection failed", error);
    process.exit(1);
  }
};
