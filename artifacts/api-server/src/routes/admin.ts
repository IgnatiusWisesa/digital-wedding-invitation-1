import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose, { Schema, Document } from "mongoose";
import { RsvpModel } from "./rsvp";
import { logger } from "../lib/logger";
import { connectDB, getMongoUri } from "../lib/db";

interface IAppSettings extends Document {
  key: string;
  value: string;
}

const AppSettingsSchema = new Schema<IAppSettings>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});

export const AppSettingsModel =
  (mongoose.models.AppSettings as mongoose.Model<IAppSettings>) ||
  mongoose.model<IAppSettings>("AppSettings", AppSettingsSchema);

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "wedding-jwt-secret";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const TICKET_SECRET = process.env.TICKET_SIGNING_SECRET || "secret";
const MONGODB_URI = getMongoUri();

function signAdminToken(username: string): string {
  // @ts-ignore
  return jwt.sign({ username, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

function signTicketToken(code: string, name: string): string {
  // @ts-ignore
  return jwt.sign({ code, name }, TICKET_SECRET, { expiresIn: "90d", algorithm: "HS256" });
}

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    // @ts-ignore
    const payload = jwt.verify(token, JWT_SECRET);
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const access_token = signAdminToken(username);
  return res.json({ access_token, username });
});

router.get("/admin/stats", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.json({ total: 0, attending: 0, notAttending: 0, checkedIn: 0 });
    await connectDB();

    const desk = req.query.desk as string | undefined;

    if (desk) {
      // Desk-specific stats: check-ins at this desk + global attending
      const deskFilter = { checkInDesk: desk, isCheckedIn: true };
      const [checkedIn, byEventAgg, totalAttending] = await Promise.all([
        RsvpModel.countDocuments(deskFilter),
        RsvpModel.aggregate([
          { $match: deskFilter },
          { $group: { _id: { $toLower: "$attendanceChoice" }, count: { $sum: 1 } } },
        ]),
        RsvpModel.countDocuments({ attendanceStatus: "Hadir" }),
      ]);
      const byEventMap: Record<string, number> = {};
      for (const item of byEventAgg) byEventMap[item._id] = item.count;
      return res.json({
        checkedIn,
        totalAttending,
        byEvent: {
          gereja: byEventMap["gereja"] || 0,
          resepsi: byEventMap["resepsi"] || 0,
          keduanya: byEventMap["keduanya"] || 0,
        },
      });
    }

    const [total, attending, notAttending, checkedIn, guestCountAgg, byEvent] = await Promise.all([
      RsvpModel.countDocuments(),
      RsvpModel.countDocuments({ attendanceStatus: "Hadir" }),
      RsvpModel.countDocuments({ attendanceStatus: "Tidak" }),
      RsvpModel.countDocuments({ checkedInAt: { $exists: true, $ne: null } }),
      RsvpModel.aggregate([
        { $match: { attendanceStatus: "Hadir" } },
        { $group: { _id: null, total: { $sum: "$guestCount" } } },
      ]),
      RsvpModel.aggregate([
        { $match: { attendanceStatus: "Hadir" } },
        { $group: { _id: { $toLower: "$attendanceChoice" }, count: { $sum: { $ifNull: ["$guestCount", 1] } } } },
      ]),
    ]);

    const totalGuestCount = guestCountAgg[0]?.total || 0;
    const byEventMap: Record<string, number> = {};
    for (const item of byEvent) {
      byEventMap[item._id] = item.count;
    }

    return res.json({
      total,
      attending,
      notAttending,
      checkedIn,
      totalGuestCount,
      byEvent: {
        gereja: byEventMap["gereja"] || 0,
        resepsi: byEventMap["resepsi"] || 0,
        keduanya: byEventMap["keduanya"] || 0,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Stats error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/guests/export", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });
    await connectDB();

    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.default.Workbook();
    const sheet = workbook.addWorksheet("Guests");
    sheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Attendance Status", key: "attendanceStatus", width: 20 },
      { header: "Attendance Choice", key: "attendanceChoice", width: 20 },
      { header: "Wishes", key: "note", width: 40 },
      { header: "Admin Notes", key: "adminNote", width: 40 },
      { header: "Guest Count (RSVP)", key: "guestCount", width: 18 },
      { header: "Guest Count (Real)", key: "guestCountReal", width: 18 },
      { header: "Angpau", key: "angpauOption", width: 15 },
      { header: "Sticker #", key: "stickerNumber", width: 12 },
      { header: "Checked In", key: "isCheckedIn", width: 15 },
      { header: "Check-in Time", key: "checkedInAt", width: 20 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    const deskFilter = req.query.desk as string | undefined;
    const exportQuery: Record<string, unknown> = {};
    if (deskFilter) { exportQuery.checkInDesk = deskFilter; exportQuery.isCheckedIn = true; }
    const guests = await RsvpModel.find(exportQuery).sort({ checkedInAt: -1, createdAt: -1 });
    for (const g of guests) {
      sheet.addRow({
        name: g.name,
        attendanceStatus: g.attendanceStatus,
        attendanceChoice: g.attendanceChoice,
        note: g.note || "",
        adminNote: (g as any).adminNote || "",
        guestCount: g.guestCount,
        guestCountReal: (g as any).guestCountReal ?? "",
        angpauOption: g.angpauOption || "tanpa",
        stickerNumber: g.stickerNumber ?? "",
        isCheckedIn: g.isCheckedIn ? "Yes" : "No",
        checkedInAt: g.checkedInAt ? new Date(g.checkedInAt).toLocaleString() : "",
        createdAt: g.createdAt ? new Date(g.createdAt).toLocaleString() : "",
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `wedding-guests-${new Date().toISOString().split("T")[0]}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err) {
    req.log.error({ err }, "Export error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/guests", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.json({ guests: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }, total: 0, page: 1, totalPages: 0 });
    await connectDB();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const desk = req.query.desk as string | undefined;

    const query: Record<string, unknown> = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (desk) {
      query.checkInDesk = desk;
      query.isCheckedIn = true;
    }

    const [guests, total] = await Promise.all([
      RsvpModel.find(query).skip(skip).limit(limit).sort({ checkedInAt: -1, createdAt: -1 }),
      RsvpModel.countDocuments(query),
    ]);

    const guestsWithTokens = guests.map((g) => {
      let ticketToken = null;
      if (g.ticketCode && g.attendanceStatus === "Hadir") {
        ticketToken = signTicketToken(g.ticketCode, g.name);
      }
      return { ...g.toObject(), ticketToken };
    });

    return res.json({
      guests: guestsWithTokens,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Get guests error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/guests", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });
    await connectDB();

    const { name, attendanceStatus, attendanceChoice, note, adminNote, guestCount = 1, guestCountReal, angpauOption = "tanpa" } = req.body;
    const normalizedName = name.trim().replace(/\s+/g, " ");
    const searchName = normalizedName.toLowerCase();

    const { randomUUID } = await import("crypto");
    const ticketCode = randomUUID();
    const ticketToken = attendanceStatus === "Hadir" ? signTicketToken(ticketCode, normalizedName) : null;

    let stickerNumber: number | undefined;
    if (angpauOption === "kado") {
      const lastSticker = await RsvpModel.findOne({ stickerNumber: { $exists: true } }).sort({ stickerNumber: -1 }).select("stickerNumber");
      stickerNumber = (lastSticker?.stickerNumber ?? 0) + 1;
    }

    const newRsvp = await RsvpModel.create({
      name: normalizedName,
      normalizedName: searchName,
      attendanceChoice,
      attendanceStatus,
      note,
      adminNote,
      guestCount: Math.max(1, parseInt(guestCount) || 1),
      ...(guestCountReal !== undefined ? { guestCountReal: Math.max(1, parseInt(guestCountReal) || 1) } : {}),
      angpauOption,
      ...(stickerNumber !== undefined ? { stickerNumber } : {}),
      ticketCode: attendanceStatus === "Hadir" ? ticketCode : undefined,
      ticketIssuedAt: attendanceStatus === "Hadir" ? new Date() : undefined,
    });

    return res.status(201).json({
      success: true,
      message: "Guest created successfully",
      guest: { ...newRsvp.toObject(), ticketToken },
    });
  } catch (err) {
    req.log.error({ err }, "Create guest error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/guests/:id", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });

    const { id } = req.params;
    const { attendanceStatus, attendanceChoice, isCheckedIn, note, adminNote, guestCount, guestCountReal, angpauOption } = req.body;
    const user = (req as any).user;

    await connectDB();
    const guest = await RsvpModel.findById(id);
    if (!guest) return res.status(404).json({ error: "Guest not found" });

    if (attendanceStatus !== undefined) {
      guest.attendanceStatus = attendanceStatus;
      if (attendanceStatus === "Hadir" && !guest.ticketCode) {
        const { randomUUID } = await import("crypto");
        guest.ticketCode = randomUUID();
        guest.ticketIssuedAt = new Date();
      }
    }
    if (attendanceChoice !== undefined) guest.attendanceChoice = attendanceChoice;
    if (note !== undefined) guest.note = note;
    if (adminNote !== undefined) (guest as any).adminNote = adminNote;
    if (guestCount !== undefined) guest.guestCount = Math.max(1, parseInt(guestCount) || 1);
    if (guestCountReal !== undefined) (guest as any).guestCountReal = guestCountReal === null ? undefined : Math.max(1, parseInt(guestCountReal) || 1);
    if (angpauOption !== undefined) {
      const prevOption = guest.angpauOption;
      guest.angpauOption = angpauOption;
      if (angpauOption === "kado" && prevOption !== "kado" && !guest.stickerNumber) {
        const lastSticker = await RsvpModel.findOne({ stickerNumber: { $exists: true } }).sort({ stickerNumber: -1 }).select("stickerNumber");
        guest.stickerNumber = (lastSticker?.stickerNumber ?? 0) + 1;
      }
    }
    if (isCheckedIn !== undefined) {
      guest.isCheckedIn = isCheckedIn;
      if (isCheckedIn && !guest.checkedInAt) {
        guest.checkedInAt = new Date();
        guest.checkedInBy = user?.username;
        guest.checkInMethod = "manual";
      }
    }

    await guest.save();

    let ticketToken = null;
    if (guest.ticketCode && guest.attendanceStatus === "Hadir") {
      ticketToken = signTicketToken(guest.ticketCode, guest.name);
    }

    return res.json({ success: true, guest: { ...guest.toObject(), ticketToken } });
  } catch (err) {
    req.log.error({ err }, "Update guest error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/checkin/scan", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });

    const { qrData, desk = "master", guestCountReal, angpauOption } = req.body;
    let payload: any;
    try {
      // @ts-ignore
      payload = jwt.verify(qrData, TICKET_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid QR code" });
    }

    await connectDB();
    const guest = await RsvpModel.findOne({ ticketCode: payload.code });
    if (!guest) return res.status(404).json({ success: false, message: "Guest not found" });

    if (guest.isCheckedIn) {
      return res.json({ success: false, message: "Guest already checked in", guest: guest.toObject() });
    }

    guest.isCheckedIn = true;
    guest.checkedInAt = new Date();
    guest.checkedInBy = (req as any).user?.username;
    guest.checkInMethod = "qr";
    (guest as any).checkInDesk = desk;

    if (guestCountReal !== undefined && guestCountReal !== null) {
      (guest as any).guestCountReal = Math.max(1, parseInt(guestCountReal) || 1);
    }
    if (angpauOption && angpauOption !== "tanpa") {
      guest.angpauOption = angpauOption;
      if (angpauOption === "kado" && !guest.stickerNumber) {
        const lastSticker = await RsvpModel.findOne({ stickerNumber: { $exists: true, $ne: null } }).sort({ stickerNumber: -1 }).select("stickerNumber");
        guest.stickerNumber = (lastSticker?.stickerNumber ?? 0) + 1;
      }
    }

    await guest.save();

    let ticketToken = null;
    if (guest.ticketCode) ticketToken = signTicketToken(guest.ticketCode, guest.name);

    return res.json({ success: true, message: "Check-in successful", guest: { ...guest.toObject(), ticketToken } });
  } catch (err) {
    req.log.error({ err }, "Admin checkin scan error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/reset — delete all RSVPs, photos, and optionally invites
router.post("/admin/reset", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });
    await connectDB();

    const { target } = req.body as { target: "rsvp" | "photos" | "invites" | "all" };
    if (!target) return res.status(400).json({ error: "target required: rsvp | photos | invites | all" });

    const { PhotoModel } = await import("./photos");
    const { InviteModel } = await import("./sheets");

    const result: Record<string, number> = {};

    if (target === "rsvp" || target === "all") {
      const r = await RsvpModel.deleteMany({});
      result.rsvps = r.deletedCount;
    }
    if (target === "photos" || target === "all") {
      // Also delete from Cloudinary if configured
      const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
      const API_KEY = process.env.CLOUDINARY_API_KEY;
      const API_SECRET = process.env.CLOUDINARY_API_SECRET;
      if (CLOUD_NAME && API_KEY && API_SECRET) {
        try {
          const { v2: cloudinary } = await import("cloudinary");
          cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });
          const photos = await PhotoModel.find({ public_id: { $exists: true, $ne: null } });
          const ids = photos.map((p: any) => p.public_id).filter(Boolean);
          if (ids.length > 0) await cloudinary.api.delete_resources(ids);
        } catch { /* ignore */ }
      }
      const r = await PhotoModel.deleteMany({});
      result.photos = r.deletedCount;
    }
    if (target === "invites" || target === "all") {
      const r = await InviteModel.deleteMany({});
      result.invites = r.deletedCount;
    }

    return res.json({ success: true, deleted: result });
  } catch (err) {
    req.log.error({ err }, "Reset error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/app-settings — fetch all settings (key/value pairs)
router.get("/admin/app-settings", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.json({});
    await connectDB();
    const settings = await AppSettingsModel.find({});
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return res.json(map);
  } catch (err) {
    req.log.error({ err }, "App settings get error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/app-settings — upsert a setting by key
router.post("/admin/app-settings", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });
    await connectDB();
    const { key, value } = req.body as { key: string; value: string };
    if (!key || value === undefined) return res.status(400).json({ error: "key and value required" });
    await AppSettingsModel.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
    return res.json({ success: true, key, value });
  } catch (err) {
    req.log.error({ err }, "App settings post error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
