import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose, { Schema, Document } from "mongoose";
import { RsvpModel } from "./rsvp";
import { InviteModel } from "./sheets";
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
      const isGerejaDesk = desk === "master";
      const deskFilter = isGerejaDesk
        ? { checkInGereja: true }
        : { $or: [
            { checkInResepsi: true, checkInResepsiDesk: desk },
            { checkInResepsi: { $ne: true }, checkInDesk: desk, isCheckedIn: true },
          ] };
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

    const [total, attending, notAttending, checkedIn, guestCountAgg, byEvent, totalInvited] = await Promise.all([
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
      InviteModel.countDocuments(),
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
      totalInvited,
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
    const search = (req.query.search as string) || "";
    const skip = (page - 1) * limit;
    const desk = req.query.desk as string | undefined;

    // Desk view: only show checked-in RSVPs (unchanged behaviour)
    if (desk) {
      const isGerejaDesk = desk === "master";
      const query: Record<string, unknown> = isGerejaDesk
        ? { checkInGereja: true }
        : { $or: [
            { checkInResepsi: true, checkInResepsiDesk: desk },
            { checkInResepsi: { $ne: true }, checkInDesk: desk, isCheckedIn: true },
          ] } as any;
      if (search) query.name = { $regex: search, $options: "i" };
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
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    // Normal view: merge RSVPs + pending invites (guests who haven't RSVPed yet)
    const searchRegex = search ? { $regex: search, $options: "i" } : undefined;
    const rsvpQuery: Record<string, unknown> = searchRegex
      ? { $or: [{ name: searchRegex }, { invitedName: searchRegex }] } as any
      : {};
    const inviteQuery: Record<string, unknown> = searchRegex ? { name: searchRegex } : {};

    const [allRsvps, allInvites] = await Promise.all([
      RsvpModel.find(rsvpQuery).sort({ checkedInAt: -1, createdAt: -1 }),
      InviteModel.find(inviteQuery).sort({ createdAt: -1 }),
    ]);

    // Build set of normalized names that have already RSVPed
    const rsvpNames = new Set(allRsvps.map((r) => r.normalizedName));

    const rsvpGuests = allRsvps.map((g) => {
      let ticketToken = null;
      if (g.ticketCode && g.attendanceStatus === "Hadir") {
        ticketToken = signTicketToken(g.ticketCode, g.name);
      }
      return { ...g.toObject(), ticketToken };
    });

    // Pending invites: in InviteModel but no matching RSVP yet
    const pendingGuests = allInvites
      .filter((inv) => !rsvpNames.has(inv.name.trim().toLowerCase()))
      .map((inv) => ({
        _id: inv._id,
        name: inv.name,
        attendanceStatus: "Belum RSVP",
        attendanceChoice: inv.event,
        guestCount: inv.quota,
        guestQuota: inv.quota,
        adminNote: inv.note || "",
        note: "",
        angpauOption: "tanpa",
        isCheckedIn: false,
        ticketToken: null,
        createdAt: inv.createdAt,
        inviteCode: inv.code,
      }));

    const allGuests = [...rsvpGuests, ...pendingGuests];
    const total = allGuests.length;
    const paginated = allGuests.slice(skip, skip + limit);

    return res.json({
      guests: paginated,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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

    const { name, attendanceStatus, attendanceChoice, note, adminNote, guestCount = 1, guestCountReal, angpauOption = "tanpa", isCheckedIn, checkInDesk } = req.body;
    const normalizedName = name.trim().replace(/\s+/g, " ");
    const searchName = normalizedName.toLowerCase();
    const user = (req as any).user;

    const { randomUUID } = await import("crypto");
    const ticketCode = randomUUID();
    const ticketToken = attendanceStatus === "Hadir" ? signTicketToken(ticketCode, normalizedName) : null;

    let stickerNumber: number | undefined;
    if (angpauOption === "kado") {
      const lastSticker = await RsvpModel.findOne({ stickerNumber: { $exists: true } }).sort({ stickerNumber: -1 }).select("stickerNumber");
      stickerNumber = (lastSticker?.stickerNumber ?? 0) + 1;
    }

    const checkedIn = isCheckedIn === true || isCheckedIn === "true";

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
      ...(checkedIn ? {
        isCheckedIn: true,
        checkedInAt: new Date(),
        checkedInBy: user?.username,
        checkInMethod: "manual",
        ...(checkInDesk ? { checkInDesk } : {}),
        ...(checkInDesk === "master"
          ? { checkInGereja: true, checkInGerejaAt: new Date() }
          : checkInDesk
            ? { checkInResepsi: true, checkInResepsiAt: new Date(), checkInResepsiDesk: checkInDesk }
            : {}),
      } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "Guest created successfully",
      guest: { ...newRsvp.toObject(), ticketToken },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Tamu dengan nama ini sudah terdaftar. Cari namanya di daftar tamu untuk mengedit." });
    }
    req.log.error({ err }, "Create guest error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/invites/search?q=xxx — autocomplete from InviteModel (master data)
router.get("/admin/invites/search", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.json([]);
    await connectDB();
    const q = ((req.query.q as string) || "").trim();
    if (!q) return res.json([]);
    const invites = await InviteModel.find({ name: { $regex: q, $options: "i" } })
      .limit(30)
      .lean();
    // Deduplicate by name (keep latest entry per name)
    const seen = new Map<string, typeof invites[0]>();
    for (const inv of invites) {
      const key = inv.name.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, inv);
    }
    return res.json(
      Array.from(seen.values()).slice(0, 10).map((inv) => ({
        name: inv.name,
        quota: inv.quota,
        event: inv.event,
        note: inv.note,
        code: inv.code,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Invite search error");
    return res.json([]);
  }
});

router.patch("/admin/guests/:id", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });

    const { id } = req.params;
    const { attendanceStatus, attendanceChoice, isCheckedIn, note, adminNote, guestCount, guestCountReal, angpauOption, checkInDesk } = req.body;
    const user = (req as any).user;

    await connectDB();
    let guest = await RsvpModel.findById(id);

    // If not found in RsvpModel, check if it's a pending invite (Belum RSVP)
    if (!guest) {
      const invite = await InviteModel.findById(id);
      if (!invite) return res.status(404).json({ error: "Guest not found" });
      // Convert pending invite → new RSVP record
      const { randomUUID } = await import("crypto");
      const normalizedName = invite.name.trim().replace(/\s+/g, " ");
      const newAttendanceStatus = attendanceStatus ?? "Hadir";
      const ticketCode = newAttendanceStatus === "Hadir" ? randomUUID() : undefined;
      guest = await RsvpModel.create({
        name: normalizedName,
        normalizedName: normalizedName.toLowerCase(),
        attendanceStatus: newAttendanceStatus,
        attendanceChoice: attendanceChoice ?? invite.event,
        note: note ?? "",
        adminNote: adminNote ?? invite.note ?? "",
        guestCount: guestCount ? Math.max(1, parseInt(guestCount) || 1) : (invite.quota ?? 1),
        angpauOption: angpauOption ?? "tanpa",
        ticketCode,
        ticketIssuedAt: ticketCode ? new Date() : undefined,
      }) as any;
      let ticketToken = null;
      if ((guest as any).ticketCode && (guest as any).attendanceStatus === "Hadir") {
        ticketToken = signTicketToken((guest as any).ticketCode, (guest as any).name);
      }
      return res.json({ success: true, guest: { ...(guest as any).toObject(), ticketToken } });
    }

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
      if (isCheckedIn) {
        // Only update event-based fields if desk is explicitly provided
        if (checkInDesk) {
          const isGerejaDesk = checkInDesk === "master";
          if (isGerejaDesk && !(guest as any).checkInGereja) {
            (guest as any).checkInGereja = true;
            (guest as any).checkInGerejaAt = new Date();
          } else if (!isGerejaDesk && !(guest as any).checkInResepsi) {
            (guest as any).checkInResepsi = true;
            (guest as any).checkInResepsiAt = new Date();
            (guest as any).checkInResepsiDesk = checkInDesk;
          }
          (guest as any).checkInDesk = checkInDesk;
        }
        guest.isCheckedIn = true;
        if (!guest.checkedInAt) guest.checkedInAt = new Date();
        guest.checkedInBy = user?.username;
        guest.checkInMethod = "manual";
      } else {
        guest.isCheckedIn = isCheckedIn;
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

    const isGerejaDesk = desk === "master";
    if (isGerejaDesk && (guest as any).checkInGereja) {
      return res.json({ success: false, message: "Tamu sudah check-in di Gereja", guest: guest.toObject() });
    }
    const alreadyResepsi = (guest as any).checkInResepsi
      || (!isGerejaDesk && (guest as any).checkInDesk && (guest as any).checkInDesk !== "master" && guest.isCheckedIn);
    if (!isGerejaDesk && alreadyResepsi) {
      const prevDesk = (guest as any).checkInResepsiDesk || (guest as any).checkInDesk || "meja resepsi";
      return res.json({ success: false, message: `Tamu sudah check-in di Resepsi (${prevDesk})`, guest: guest.toObject() });
    }

    if (isGerejaDesk) {
      (guest as any).checkInGereja = true;
      (guest as any).checkInGerejaAt = new Date();
    } else {
      (guest as any).checkInResepsi = true;
      (guest as any).checkInResepsiAt = new Date();
      (guest as any).checkInResepsiDesk = desk;
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

// POST /api/admin/reset/verify — cek password reset saja
router.post("/admin/reset/verify", authMiddleware, async (req, res) => {
  const { resetPassword } = req.body;
  const RESET_PWD = process.env.RESET_PASSWORD;
  if (RESET_PWD && resetPassword !== RESET_PWD) {
    return res.status(403).json({ error: "Password salah. Akses ditolak." });
  }
  return res.json({ success: true });
});

// POST /api/admin/reset — delete all RSVPs, photos, and optionally invites
router.post("/admin/reset", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });
    await connectDB();

    const { target, resetPassword } = req.body as { target: "rsvp" | "photos" | "invites" | "all"; resetPassword?: string };
    if (!target) return res.status(400).json({ error: "target required: rsvp | photos | invites | all" });

    const RESET_PWD = process.env.RESET_PASSWORD;
    if (RESET_PWD && resetPassword !== RESET_PWD) {
      return res.status(403).json({ error: "Password salah. Tindakan reset dibatalkan." });
    }

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

// GET /api/public/streaming-link — public endpoint, no auth required
router.get("/public/streaming-link", async (req, res) => {
  try {
    if (!MONGODB_URI) return res.json({ url: null });
    await connectDB();
    const setting = await AppSettingsModel.findOne({ key: "streaming_link" });
    return res.json({ url: setting ? setting.value : null });
  } catch (err) {
    return res.json({ url: null });
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
