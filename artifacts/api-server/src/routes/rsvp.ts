import { Router } from "express";
import mongoose, { Schema, Document } from "mongoose";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";

const router = Router();

const TICKET_SECRET = process.env.TICKET_SIGNING_SECRET || "secret";
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";

let isConnected = false;

async function connectDB() {
  if (isConnected || !MONGODB_URI) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
  } catch (e) {
    logger.error({ e }, "MongoDB connection error");
  }
}
connectDB();

interface IRsvp extends Document {
  name: string;
  normalizedName: string;
  attendanceChoice: string;
  note?: string;
  attendanceStatus: string;
  ticketCode?: string;
  ticketIssuedAt?: Date;
  isCheckedIn: boolean;
  checkInTime?: Date;
  qrCodeData?: string;
  checkedInAt?: Date;
  checkedInBy?: string;
  checkInMethod?: string;
  sentimentScore: number;
  guestQuota: number;
  guestCount: number;
  createdAt?: Date;
}

const RsvpSchema = new Schema<IRsvp>(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    attendanceChoice: { type: String, required: true },
    note: { type: String },
    attendanceStatus: { type: String, required: true },
    ticketCode: { type: String, unique: true, sparse: true },
    ticketIssuedAt: { type: Date },
    isCheckedIn: { type: Boolean, default: false },
    checkInTime: { type: Date },
    qrCodeData: { type: String, unique: true, sparse: true },
    checkedInAt: { type: Date },
    checkedInBy: { type: String },
    checkInMethod: { type: String, enum: ["qr", "manual"] },
    sentimentScore: { type: Number, default: 0 },
    guestQuota: { type: Number, default: 1 },
    guestCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const RsvpModel = mongoose.models.Rsvp || mongoose.model<IRsvp>("Rsvp", RsvpSchema);

function signTicket(code: string, name: string): string {
  // @ts-ignore
  return jwt.sign({ code, name }, TICKET_SECRET, { expiresIn: "90d", algorithm: "HS256" });
}

router.post("/rsvp", async (req, res) => {
  try {
    await connectDB();
    if (!MONGODB_URI) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const { name, attendanceChoice, attendanceStatus, note, guestQuota = 1, guestCount = 1 } = req.body;

    if (!name || !attendanceChoice || !attendanceStatus) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const normalizedName = name.trim().replace(/\s+/g, " ");
    const searchName = normalizedName.toLowerCase();

    const ticketCode = randomUUID();
    // @ts-ignore
    const ticketToken = attendanceStatus === "Hadir" ? signTicket(ticketCode, normalizedName) : null;

    const actualGuestCount = attendanceStatus === "Hadir" ? Math.min(guestCount, guestQuota) : 1;

    const updated = await RsvpModel.findOneAndUpdate(
      { normalizedName: searchName },
      {
        name: normalizedName,
        normalizedName: searchName,
        attendanceChoice,
        attendanceStatus,
        note,
        ticketCode: attendanceStatus === "Hadir" ? ticketCode : undefined,
        ticketIssuedAt: attendanceStatus === "Hadir" ? new Date() : undefined,
        sentimentScore: 0,
        guestQuota,
        guestCount: actualGuestCount,
      },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      rsvp: {
        name: updated.name,
        attendanceStatus: updated.attendanceStatus,
        ticketToken,
      },
    });
  } catch (err) {
    req.log.error({ err }, "RSVP error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/rsvp/wishes", async (req, res) => {
  try {
    await connectDB();
    if (!MONGODB_URI) return res.json([]);

    const wishes = await RsvpModel.find({ note: { $exists: true, $ne: "" } })
      .sort({ sentimentScore: -1, _id: -1 })
      .limit(50)
      .select("name note attendanceStatus sentimentScore");

    return res.json(wishes);
  } catch (err) {
    req.log.error({ err }, "Wishes error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export { signTicket };
export default router;
