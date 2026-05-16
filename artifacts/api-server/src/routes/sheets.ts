import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose, { Schema, model, models } from "mongoose";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { connectDB, getMongoUri } from "../lib/db";

const router = Router();

const SHEET_ID = "15kDvVvnn9Hwy-E0TcnQIdZEfpBjpBvC7XVF3lY8EYNM";
const TARGET_SHEET_GID = 768801319;
const MONGODB_URI = getMongoUri();

// ── Invite model ──────────────────────────────────────────────
interface IInvite {
  code: string;
  name: string;
  quota: number;
  event: string;
  note: string;
  sheetRow: number;
  createdAt: Date;
}

const InviteSchema = new Schema<IInvite>({
  code:      { type: String, required: true, unique: true, index: true },
  name:      { type: String, required: true },
  quota:     { type: Number, default: 1 },
  event:     { type: String, default: "Resepsi" },
  note:      { type: String, default: "" },
  sheetRow:  { type: Number },
  createdAt: { type: Date, default: Date.now },
});

export const InviteModel =
  (models.Invite as mongoose.Model<IInvite>) ||
  model<IInvite>("Invite", InviteSchema);

// ── Helpers ───────────────────────────────────────────────────

function authMiddleware(req: any, res: any, next: any) {
  const JWT_SECRET = process.env.JWT_SECRET || "wedding-jwt-secret";
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    // @ts-ignore
    jwt.verify(authHeader.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function parseEvent(raw: string): string {
  if (!raw) return "Resepsi";
  const v = raw.trim().toUpperCase();
  if (v === "GR" || v === "KEDUANYA" || v === "BOTH") return "Keduanya";
  if (v === "G" || v === "GEREJA" || v === "CHURCH") return "Gereja";
  return "Resepsi";
}

/** Generate a short URL-safe code, e.g. "a3b9k2mp" */
function makeShortCode(): string {
  return crypto.randomBytes(6).toString("base64url").slice(0, 8);
}

async function findTabName(connectors: ReplitConnectors): Promise<string> {
  const metaResp = await connectors.proxy(
    "google-sheet",
    `/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties`
  );
  const meta = await metaResp.json() as any;
  const sheets = meta.sheets || [];
  const target = sheets.find((s: any) => s.properties?.sheetId === TARGET_SHEET_GID);
  if (target) return target.properties.title as string;
  return sheets[0]?.properties?.title || "Sheet1";
}

// ── Routes ────────────────────────────────────────────────────

// GET /api/admin/sheets/preview
router.get("/admin/sheets/preview", authMiddleware, async (req, res) => {
  try {
    const connectors = new ReplitConnectors();
    const tabName = await findTabName(connectors);
    const response = await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(tabName)}!A:F`
    );
    const data = await response.json() as any;
    const rows = (data.values || []) as string[][];
    const guests = rows.slice(1).map((row, i) => ({
      rowIndex: i + 2,
      name: row[1] || "",
      quota: parseInt(row[2]) || 1,
      event: parseEvent(row[3] || ""),
      note: row[4] || "",
      existingLink: row[5] || "",
    })).filter(g => g.name.trim() !== "");
    return res.json({ guests, tabName });
  } catch (err) {
    req.log.error({ err }, "Sheets preview error");
    return res.status(500).json({ error: "Failed to read sheet" });
  }
});

// POST /api/admin/sheets/import
router.post("/admin/sheets/import", authMiddleware, async (req, res) => {
  try {
    const { baseUrl, overwrite = false } = req.body as { baseUrl: string; overwrite?: boolean };
    if (!baseUrl) return res.status(400).json({ error: "baseUrl is required" });

    if (MONGODB_URI) await connectDB();

    const connectors = new ReplitConnectors();
    const tabName = await findTabName(connectors);
    const readResp = await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(tabName)}!A:F`
    );
    const data = await readResp.json() as any;
    const rows = (data.values || []) as string[][];

    const batchData: { range: string; values: string[][] }[] = [];
    const results: { name: string; url: string; row: number; skipped: boolean; quota: number; event: string }[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = (row[1] || "").trim();
      if (!name) continue;

      const existingLink = (row[5] || "").trim();

      // Skip if link already exists and not overwriting
      if (existingLink && !overwrite) {
        const event = parseEvent(row[3] || "");
        results.push({ name, url: existingLink, row: i + 1, skipped: true, quota: parseInt(row[2]) || 1, event });
        continue;
      }

      const quota = parseInt(row[2]) || 1;
      const event = parseEvent(row[3] || "");
      const note = row[4] || "";
      const sheetRow = i + 1;

      // Reuse existing code if available (parse from existing URL), else generate new
      let code: string;
      if (existingLink && overwrite) {
        const match = existingLink.match(/\/invite\/([a-zA-Z0-9_-]{6,12})$/);
        code = match ? match[1] : makeShortCode();
      } else {
        code = makeShortCode();
      }

      // Save/update in MongoDB
      if (MONGODB_URI) {
        await InviteModel.findOneAndUpdate(
          { code },
          { code, name, quota, event, note, sheetRow },
          { upsert: true, new: true }
        );

        // Sync guestCount + note into any existing RsvpModel records for this guest
        const { RsvpModel } = await import("./rsvp");
        const updateFields: Record<string, unknown> = { guestCount: quota, guestQuota: quota };
        if (note) updateFields.adminNote = note;
        await RsvpModel.updateMany(
          { normalizedName: name.trim().toLowerCase() },
          { $set: updateFields }
        );
      }

      const url = `${baseUrl.replace(/\/$/, "")}/invite/${code}`;
      batchData.push({ range: `${tabName}!F${sheetRow}`, values: [[url]] });
      results.push({ name, url, row: sheetRow, skipped: false, quota, event });
    }

    // Write all URLs to sheet in one batch call
    if (batchData.length > 0) {
      const writeResp = await connectors.proxy(
        "google-sheet",
        `/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valueInputOption: "RAW", data: batchData }),
        }
      );
      const writeData = await writeResp.json() as any;
      if (writeData.error) {
        req.log.error({ writeData }, "Sheet write error");
        return res.status(500).json({ error: "Failed to write links to sheet", detail: writeData.error });
      }
    }

    return res.json({
      success: true,
      total: results.length,
      written: results.filter(r => !r.skipped).length,
      skipped: results.filter(r => r.skipped).length,
      results,
    });
  } catch (err) {
    req.log.error({ err }, "Sheets import error");
    return res.status(500).json({ error: "Import failed" });
  }
});

// POST /api/admin/sheets/sync-quota — bulk sync guestCount from InviteModel → RsvpModel pending records
router.post("/admin/sheets/sync-quota", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });
    await connectDB();
    const { RsvpModel } = await import("./rsvp");

    const invites = await InviteModel.find({});
    let updated = 0;
    for (const invite of invites) {
      const updateFields: Record<string, unknown> = { guestCount: invite.quota, guestQuota: invite.quota };
      if (invite.note) updateFields.adminNote = invite.note;
      const result = await RsvpModel.updateMany(
        { normalizedName: invite.name.trim().toLowerCase() },
        { $set: updateFields }
      );
      updated += result.modifiedCount;
    }
    return res.json({ success: true, updated });
  } catch (err) {
    req.log.error({ err }, "Sync quota error");
    return res.status(500).json({ error: "Sync failed" });
  }
});

// GET /api/invite/:code — public, looks up short code from MongoDB
router.get("/invite/:code", async (req, res) => {
  try {
    if (!MONGODB_URI) {
      return res.status(503).json({ error: "Database not configured" });
    }
    await connectDB();
    const invite = await InviteModel.findOne({ code: req.params.code }).lean();
    if (!invite) {
      return res.status(404).json({ error: "Undangan tidak ditemukan" });
    }
    return res.json({
      name: invite.name,
      quota: invite.quota,
      event: invite.event,
      note: invite.note,
    });
  } catch (err) {
    req.log.error({ err }, "Invite lookup error");
    return res.status(500).json({ error: "Failed to load invite" });
  }
});

export default router;
