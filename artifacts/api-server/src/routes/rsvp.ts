import { Router } from "express";
import mongoose, { Schema, Document } from "mongoose";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { connectDB, getMongoUri } from "../lib/db";

const router = Router();

const TICKET_SECRET = process.env.TICKET_SIGNING_SECRET || "secret";
const MONGODB_URI = getMongoUri();

interface IRsvp extends Document {
  name: string;
  normalizedName: string;
  attendanceChoice: string;
  note?: string;
  adminNote?: string;
  attendanceStatus: string;
  ticketCode?: string;
  ticketIssuedAt?: Date;
  isCheckedIn: boolean;
  checkInTime?: Date;
  qrCodeData?: string;
  checkedInAt?: Date;
  checkedInBy?: string;
  checkInMethod?: string;
  checkInDesk?: string;
  checkInGereja?: boolean;
  checkInGerejaAt?: Date;
  checkInResepsi?: boolean;
  checkInResepsiAt?: Date;
  checkInResepsiDesk?: string;
  sentimentScore: number;
  guestQuota: number;
  guestCount: number;
  guestCountReal?: number;
  angpauOption?: string;
  stickerNumber?: number;
  createdAt?: Date;
}

const RsvpSchema = new Schema<IRsvp>(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    attendanceChoice: { type: String, required: true },
    note: { type: String },
    adminNote: { type: String },
    attendanceStatus: { type: String, required: true },
    ticketCode: { type: String, unique: true, sparse: true },
    ticketIssuedAt: { type: Date },
    isCheckedIn: { type: Boolean, default: false },
    checkInTime: { type: Date },
    qrCodeData: { type: String, unique: true, sparse: true },
    checkedInAt: { type: Date },
    checkedInBy: { type: String },
    checkInMethod: { type: String, enum: ["qr", "manual"] },
    checkInDesk: { type: String, default: "master" },
    checkInGereja: { type: Boolean, default: false },
    checkInGerejaAt: { type: Date },
    checkInResepsi: { type: Boolean, default: false },
    checkInResepsiAt: { type: Date },
    checkInResepsiDesk: { type: String },
    sentimentScore: { type: Number, default: 0 },
    guestQuota: { type: Number, default: 1 },
    guestCount: { type: Number, default: 1 },
    guestCountReal: { type: Number },
    angpauOption: { type: String, enum: ["tanpa", "transfer", "kado"], default: "tanpa" },
    stickerNumber: { type: Number, sparse: true },
  },
  { timestamps: true }
);

export const RsvpModel = mongoose.models.Rsvp || mongoose.model<IRsvp>("Rsvp", RsvpSchema);

function signTicket(code: string, name: string): string {
  // @ts-ignore
  return jwt.sign({ code, name }, TICKET_SECRET, { expiresIn: "90d", algorithm: "HS256" });
}

function calculateSentiment(note: string | undefined): number {
  if (!note || note.trim().length === 0) return 0;
  const text = note.trim().toLowerCase();
  // Base: character length (longer = more heartfelt), capped at 300
  let score = Math.min(text.length * 2, 300);
  // Bonus keywords (Indonesian + English)
  const bonusWords = [
    "bahagia","barokah","berkah","sehat","sukses","langgeng","kekal","cinta","kasih","sayang",
    "doa","moga","semoga","selalu","selamanya","tuhan","allah","berkah","rezeki","amin","amiin",
    "happy","love","bless","joy","wonderful","forever","wish","hope","health","togeth",
    "beautiful","amazing","blessed","grace","peace","prosper",
  ];
  for (const w of bonusWords) {
    if (text.includes(w)) score += 15;
  }
  return Math.round(score);
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
        sentimentScore: calculateSentiment(note),
        guestQuota,
        guestCount: actualGuestCount,
        angpauOption: "tanpa",
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

// GET /api/rsvp/lookup?name=xxx — cek apakah nama ini sudah pernah RSVP
router.get("/rsvp/lookup", async (req, res) => {
  try {
    await connectDB();
    if (!MONGODB_URI) return res.json({ found: false });

    const { name } = req.query;
    if (!name || typeof name !== "string") return res.json({ found: false });

    const searchName = name.trim().replace(/\s+/g, " ").toLowerCase();
    const rsvp = await RsvpModel.findOne({ normalizedName: searchName }).select(
      "name attendanceStatus ticketCode attendanceChoice guestCount"
    );

    if (!rsvp) return res.json({ found: false });

    // "Belum RSVP" = ada di invite list tapi belum submit form → tampilkan form biasa
    if (rsvp.attendanceStatus === "Belum RSVP" || !rsvp.attendanceStatus) {
      return res.json({ found: false });
    }

    // Kalau "Hadir" tapi belum punya ticketCode (misal ditambah via admin), buat sekarang
    let ticketCodeToUse = rsvp.ticketCode;
    if (rsvp.attendanceStatus === "Hadir" && !ticketCodeToUse) {
      ticketCodeToUse = randomUUID();
      await RsvpModel.updateOne(
        { _id: rsvp._id },
        { ticketCode: ticketCodeToUse, ticketIssuedAt: new Date() }
      );
    }

    const ticketToken =
      rsvp.attendanceStatus === "Hadir" && ticketCodeToUse
        ? signTicket(ticketCodeToUse, rsvp.name)
        : null;

    return res.json({
      found: true,
      rsvp: {
        name: rsvp.name,
        attendanceStatus: rsvp.attendanceStatus,
        attendanceChoice: rsvp.attendanceChoice,
        guestCount: rsvp.guestCount,
        ticketToken,
      },
    });
  } catch (err) {
    req.log.error({ err }, "RSVP lookup error");
    return res.json({ found: false });
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
