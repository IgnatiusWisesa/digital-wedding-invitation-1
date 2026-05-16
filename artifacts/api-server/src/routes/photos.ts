import { Router } from "express";
import mongoose, { Schema, Document } from "mongoose";
import { logger } from "../lib/logger";

const router = Router();
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";

interface IPhoto extends Document {
  url: string;
  public_id?: string;
  filename?: string;
  guestId: string;
  createdAt?: Date;
}

const PhotoSchema = new Schema<IPhoto>(
  {
    url: { type: String, required: true },
    public_id: { type: String },
    filename: { type: String },
    guestId: { type: String, required: true },
  },
  { timestamps: true }
);

export const PhotoModel = mongoose.models.Photo || mongoose.model<IPhoto>("Photo", PhotoSchema);

router.get("/photos", async (req, res) => {
  try {
    if (!MONGODB_URI) return res.json([]);
    const photos = await PhotoModel.find().sort({ createdAt: -1 });
    return res.json(photos);
  } catch (err) {
    req.log.error({ err }, "Get photos error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/photos/upload", async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });

    const { fileBase64, guestId } = req.body;
    if (!fileBase64) return res.status(400).json({ error: "No file data provided" });

    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
    const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

    let photoUrl = fileBase64;
    let public_id: string | undefined;

    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      try {
        const { v2: cloudinary } = await import("cloudinary");
        cloudinary.config({
          cloud_name: CLOUDINARY_CLOUD_NAME,
          api_key: CLOUDINARY_API_KEY,
          api_secret: CLOUDINARY_API_SECRET,
        });
        const result = await cloudinary.uploader.upload(fileBase64, { folder: "wedding_invitation" });
        photoUrl = result.secure_url;
        public_id = result.public_id;
      } catch (e) {
        logger.error({ e }, "Cloudinary upload failed, using base64");
      }
    }

    const photo = await PhotoModel.create({
      url: photoUrl,
      public_id,
      guestId: guestId || "anonymous",
    });

    return res.json({ message: "Photo uploaded successfully", photo });
  } catch (err) {
    req.log.error({ err }, "Upload photo error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/photos/:id/delete", async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });
    const photo = await PhotoModel.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    return res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete photo error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
