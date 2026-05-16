import mongoose from "mongoose";
import { logger } from "./logger";

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";

let connectionPromise: Promise<void> | null = null;

export function getMongoUri(): string {
  return MONGODB_URI;
}

export async function connectDB(): Promise<void> {
  if (!MONGODB_URI) return;
  if (mongoose.connection.readyState === 1) return;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      await mongoose.connect(MONGODB_URI);
      logger.info("MongoDB connected");
    } catch (e) {
      logger.error({ e }, "MongoDB connection error");
      connectionPromise = null;
      throw e;
    }
  })();

  return connectionPromise;
}

connectDB().catch(() => {});
