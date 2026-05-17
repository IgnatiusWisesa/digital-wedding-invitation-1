import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose, { Schema, model, models } from "mongoose";
import { google } from "googleapis";
import { connectDB, getMongoUri } from "../lib/db";

const router = Router();

const MONGODB_URI = getMongoUri();
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TARGET_SHEET_GID = 768801319;

// Initialize Google Sheets API client from service account
function getGoogleSheetsClient() {
  const serviceAccountJson =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
      ? Buffer.from(
          process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64,
          "base64"
        ).toString("utf8")
      : process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error("Google service account environment variable is not configured");
  }
  if (!GOOGLE_SHEET_ID) {
    throw new Error("GOOGLE_SHEET_ID environment variable is not configured");
  }

  let credentials;
  try {
    credentials = JSON.parse(serviceAccountJson);
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\\\n/g, "\\n").replace(/\\n/g, "\n");
    }
  } catch (e) {
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON format");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

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

function parseEvent(raw: string): string {
  if (!raw) return "Resepsi";
  const v = raw.trim().toUpperCase();
  if (v === "GR" || v === "KEDUANYA" || v === "BOTH") return "Keduanya";
  if (v === "G" || v === "GEREJA" || v === "CHURCH") return "Gereja";
  return "Resepsi";
}

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

/** Generate a short URL-safe code, e.g. "a3b9k2mp" */
function makeShortCode(): string {
  return crypto.randomBytes(6).toString("base64url").slice(0, 8);
}

async function findTabName(sheets: any): Promise<string> {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: GOOGLE_SHEET_ID,
    fields: "sheets.properties",
  });
  const sheetsList = response.data.sheets || [];
  const target = sheetsList.find((s: any) => s.properties?.sheetId === TARGET_SHEET_GID);
  if (target) return target.properties.title as string;
  return sheetsList[0]?.properties?.title || "Sheet1";
}

// ── Routes ────────────────────────────────────────────────────

// GET /api/admin/sheets/preview
router.get("/admin/sheets/preview", authMiddleware, async (req, res) => {
  try {
    const sheets = getGoogleSheetsClient();
    const tabName = await findTabName(sheets);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${encodeURIComponent(tabName)}!A:F`,
    });
    const rows = (response.data.values || []) as string[][];
    const guests = rows.slice(1).map((row, i) => ({
      rowIndex: i + 2,
      name: row[1] || "",
      quota: parseInt(row[2]) || 1,
      event: parseEvent(row[3] || ""),
      note: row[4] || "",
      existingLink: row[5] || "",
    })).filter(g => g.name.trim() !== "");
    return res.json({ guests, tabName });
  } catch (err: any) {
    req.log.error({ err }, "Sheets preview error");
    const message = err.message || "Failed to read sheet";
    if (message.includes("not configured")) {
      return res.status(500).json({ error: "Google Sheets credentials are not configured" });
    }
    return res.status(500).json({ error: message });
  }
});

// POST /api/admin/sheets/import
router.post("/admin/sheets/import", authMiddleware, async (req, res) => {
  try {
    const { baseUrl, overwrite = false } = req.body as { baseUrl: string; overwrite?: boolean };
    if (!baseUrl) return res.status(400).json({ error: "baseUrl is required" });

    if (MONGODB_URI) await connectDB();

    const sheets = getGoogleSheetsClient();
    const tabName = await findTabName(sheets);
    const readResp = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${encodeURIComponent(tabName)}!A:F`,
    });
    const rows = (readResp.data.values || []) as string[][];

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
      const writeResp = await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: GOOGLE_SHEET_ID,
        requestBody: {
          valueInputOption: "RAW",
          data: batchData,
        },
      });
      const writeData = writeResp.data as any;
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
  } catch (err: any) {
    req.log.error({ err }, "Sheets import error");
    const message = err.message || "Import failed";
    if (message.includes("not configured")) {
      return res.status(500).json({ error: "Google Sheets credentials are not configured" });
    }
    return res.status(500).json({ error: message });
  }
});

// POST /api/admin/sheets/sync-quota — read latest data from Google Sheet → update InviteModel + RsvpModel
router.post("/admin/sheets/sync-quota", authMiddleware, async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });
    await connectDB();
    const { RsvpModel } = await import("./rsvp");

    // Read fresh data directly from Google Sheet
    const sheets = getGoogleSheetsClient();
    const tabName = await findTabName(sheets);
    const readResp = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${encodeURIComponent(tabName)}!A:F`,
    });
    const rows = (readResp.data.values || []) as string[][];

    let updated = 0;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = (row[1] || "").trim();
      if (!name) continue;
      const quota = parseInt(row[2]) || 1;
      const event = parseEvent(row[3] || "");
      const note = (row[4] || "").trim();
      const existingLink = (row[5] || "").trim();

      // Update InviteModel with latest quota/note from sheet
      if (existingLink) {
        const match = existingLink.match(/\/invite\/([a-zA-Z0-9_-]{6,12})$/);
        if (match) {
          await InviteModel.updateOne(
            { code: match[1] },
            { $set: { quota, event, note } }
          );
        }
      }
      // Also try matching by name
      await InviteModel.updateMany(
        { name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { $set: { quota, event, note } }
      );

      // Sync into RsvpModel
      const updateFields: Record<string, unknown> = { guestCount: quota, guestQuota: quota };
      if (note) updateFields.adminNote = note;
      const result = await RsvpModel.updateMany(
        { normalizedName: name.toLowerCase() },
        { $set: updateFields }
      );
      updated += result.modifiedCount;
    }
    return res.json({ success: true, updated });
  } catch (err: any) {
    req.log.error({ err }, "Sync quota error");
    const message = err.message || "Sync failed";
    if (message.includes("not configured")) {
      return res.status(500).json({ error: "Google Sheets credentials are not configured" });
    }
    return res.status(500).json({ error: message });
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
