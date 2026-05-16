import { Router } from "express";
import jwt from "jsonwebtoken";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { connectDB, getMongoUri } from "../lib/db";
import { RsvpModel } from "./rsvp";

const router = Router();

const SHEET_ID = "15kDvVvnn9Hwy-E0TcnQIdZEfpBjpBvC7XVF3lY8EYNM";
const TARGET_SHEET_GID = 768801319; // gid from the URL shared by user
const INVITE_SECRET = process.env.TICKET_SIGNING_SECRET || "secret";
const MONGODB_URI = getMongoUri();

function authMiddleware(req: any, res: any, next: any) {
  const JWT_SECRET = process.env.JWT_SECRET || "wedding-jwt-secret";
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    // @ts-ignore
    jwt.verify(authHeader.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Map Gereja/Resepsi abbreviations from sheet to canonical values
function parseEvent(raw: string): string {
  if (!raw) return "Resepsi";
  const v = raw.trim().toUpperCase();
  if (v === "GR" || v === "KEDUANYA" || v === "BOTH") return "Keduanya";
  if (v === "G" || v === "GEREJA" || v === "CHURCH") return "Gereja";
  return "Resepsi";
}

// Generate a signed invite token containing guest info
function makeInviteToken(payload: {
  name: string;
  quota: number;
  event: string;
  note: string;
  row: number;
}): string {
  // @ts-ignore
  return jwt.sign(payload, INVITE_SECRET, { expiresIn: "365d", algorithm: "HS256" });
}

// Helper: find the tab name by sheetId (gid)
async function findTabName(connectors: ReplitConnectors): Promise<string> {
  const metaResp = await connectors.proxy(
    "google-sheet",
    `/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties`
  );
  const meta = await metaResp.json() as any;
  const sheets = meta.sheets || [];
  const target = sheets.find((s: any) => s.properties?.sheetId === TARGET_SHEET_GID);
  if (target) return target.properties.title as string;
  // Fallback: return first sheet
  return sheets[0]?.properties?.title || "Sheet1";
}

// GET /api/admin/sheets/meta — return tab names (for debugging)
router.get("/admin/sheets/meta", authMiddleware, async (req, res) => {
  try {
    const connectors = new ReplitConnectors();
    const metaResp = await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties`
    );
    const meta = await metaResp.json() as any;
    return res.json(meta);
  } catch (err) {
    req.log.error({ err }, "Sheets meta error");
    return res.status(500).json({ error: "Failed to read sheet metadata" });
  }
});

// GET /api/admin/sheets/preview — read rows without writing
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
    // Skip header row (row index 0)
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

// POST /api/admin/sheets/import — generate invite tokens and write links back to sheet
router.post("/admin/sheets/import", authMiddleware, async (req, res) => {
  try {
    const { baseUrl, overwrite = false } = req.body as { baseUrl: string; overwrite?: boolean };
    if (!baseUrl) return res.status(400).json({ error: "baseUrl is required" });

    const connectors = new ReplitConnectors();

    // 1. Read the sheet
    const tabName = await findTabName(connectors);
    const readResp = await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(tabName)}!A:F`
    );
    const data = await readResp.json() as any;
    const rows = (data.values || []) as string[][];

    // 2. Generate tokens and build write requests
    const batchData: { range: string; values: string[][] }[] = [];
    const results: { name: string; url: string; row: number; skipped: boolean }[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = (row[1] || "").trim();
      if (!name) continue;

      const existingLink = row[5] || "";
      if (existingLink && !overwrite) {
        results.push({ name, url: existingLink, row: i + 1, skipped: true });
        continue;
      }

      const quota = parseInt(row[2]) || 1;
      const event = parseEvent(row[3] || "");
      const note = row[4] || "";

      const token = makeInviteToken({ name, quota, event, note, row: i + 1 });
      const url = `${baseUrl.replace(/\/$/, "")}/invite/${token}`;

      // Column F = index 5, row is i+1 (1-based)
      batchData.push({ range: `${tabName}!F${i + 1}`, values: [[url]] });
      results.push({ name, url, row: i + 1, skipped: false });
    }

    // 3. Write all links back in a single batchUpdate
    if (batchData.length > 0) {
      const writeResp = await connectors.proxy(
        "google-sheet",
        `/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            valueInputOption: "RAW",
            data: batchData,
          }),
        }
      );
      const writeData = await writeResp.json() as any;
      if (writeData.error) {
        req.log.error({ writeData }, "Sheet write error");
        return res.status(500).json({ error: "Failed to write links to sheet", detail: writeData.error });
      }
    }

    // 4. Optionally pre-create guest records in MongoDB (without overwriting existing RSVPs)
    if (MONGODB_URI) {
      await connectDB();
      for (const r of results) {
        if (r.skipped) continue;
        const searchName = r.name.toLowerCase();
        await RsvpModel.updateOne(
          { normalizedName: searchName },
          { $setOnInsert: { name: r.name, normalizedName: searchName, attendanceStatus: "pending", attendanceChoice: "Resepsi", guestQuota: 1, guestCount: 1, angpauOption: "tanpa", isCheckedIn: false, sentimentScore: 0 } },
          { upsert: true }
        );
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

// GET /api/invite/:token — decode and return invite payload (public)
router.get("/invite/:token", (req, res) => {
  try {
    // @ts-ignore
    const payload = jwt.verify(req.params.token, INVITE_SECRET) as any;
    return res.json({
      name: payload.name,
      quota: payload.quota,
      event: payload.event,
      note: payload.note,
    });
  } catch {
    return res.status(400).json({ error: "Invalid or expired invite link" });
  }
});

export default router;
