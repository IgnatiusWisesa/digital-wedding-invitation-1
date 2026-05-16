import { Router } from "express";
import jwt from "jsonwebtoken";
import { RsvpModel } from "./rsvp";

const router = Router();
const TICKET_SECRET = process.env.TICKET_SIGNING_SECRET || "secret";
const API_KEY = process.env.CHECKIN_API_KEY || "";

function apiKeyMiddleware(req: any, res: any, next: any) {
  if (!API_KEY) return next();
  const key = req.headers["x-api-key"];
  if (key !== API_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
}

router.post("/checkin", apiKeyMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token required" });

    let payload: any;
    try {
      // @ts-ignore
      payload = jwt.verify(token, TICKET_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid ticket signature" });
    }

    const guest = await RsvpModel.findOne({ ticketCode: payload.code });
    if (!guest) return res.status(404).json({ success: false, message: "Guest not found" });

    if (guest.isCheckedIn) {
      return res.json({ success: false, message: "Guest already checked in", guest: guest.toObject() });
    }

    guest.isCheckedIn = true;
    guest.checkedInAt = new Date();
    guest.checkInMethod = "qr";
    await guest.save();

    return res.json({ success: true, message: "Check-in successful", guest: guest.toObject() });
  } catch (err) {
    req.log.error({ err }, "Checkin error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
