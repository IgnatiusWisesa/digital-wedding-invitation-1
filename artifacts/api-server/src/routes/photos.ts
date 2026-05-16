import { Router } from "express";
import multer from "multer";
import mongoose, { Schema, Document } from "mongoose";
import { logger } from "../lib/logger";
import { connectDB, getMongoUri } from "../lib/db";

const router = Router();
const MONGODB_URI = getMongoUri();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
    await connectDB();
    const photos = await PhotoModel.find().sort({ createdAt: -1 });
    return res.json(photos);
  } catch (err) {
    req.log.error({ err }, "Get photos error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/photos/upload", upload.single("file"), async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });
    await connectDB();

    const guestId = req.body?.guestId || "anonymous";

    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
    const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

    let photoUrl: string;
    let public_id: string | undefined;
    let filename: string | undefined;

    if (req.file) {
      // Multipart file upload
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      filename = req.file.originalname;

      if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
        try {
          const { v2: cloudinary } = await import("cloudinary");
          cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
          const result = await cloudinary.uploader.upload(base64, { folder: "wedding_invitation" });
          photoUrl = result.secure_url;
          public_id = result.public_id;
        } catch (e) {
          logger.error({ e }, "Cloudinary upload failed, using base64");
          photoUrl = base64;
        }
      } else {
        photoUrl = base64;
      }
    } else if (req.body?.fileBase64) {
      // JSON base64 fallback
      const fileBase64 = req.body.fileBase64;
      if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
        try {
          const { v2: cloudinary } = await import("cloudinary");
          cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
          const result = await cloudinary.uploader.upload(fileBase64, { folder: "wedding_invitation" });
          photoUrl = result.secure_url;
          public_id = result.public_id;
        } catch (e) {
          logger.error({ e }, "Cloudinary upload failed, using base64");
          photoUrl = fileBase64;
        }
      } else {
        photoUrl = fileBase64;
      }
    } else {
      return res.status(400).json({ error: "No file data provided" });
    }

    const photo = await PhotoModel.create({ url: photoUrl, public_id, filename, guestId });
    return res.json({ message: "Photo uploaded successfully", photo });
  } catch (err) {
    req.log.error({ err }, "Upload photo error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/photos/:id/delete", async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });
    await connectDB();
    const photo = await PhotoModel.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    if (photo.public_id) {
      try {
        const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
        const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
        const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
        if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
          const { v2: cloudinary } = await import("cloudinary");
          cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
          await cloudinary.uploader.destroy(photo.public_id);
        }
      } catch { /* ignore cloudinary errors */ }
    }
    return res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete photo error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/photos/bulk-delete — delete multiple photos by IDs
router.post("/photos/bulk-delete", async (req, res) => {
  try {
    if (!MONGODB_URI) return res.status(503).json({ error: "DB not configured" });
    await connectDB();
    const { ids } = req.body as { ids: string[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array required" });
    }
    const photos = await PhotoModel.find({ _id: { $in: ids } });
    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
    const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      const publicIds = photos.map(p => p.public_id).filter(Boolean) as string[];
      if (publicIds.length > 0) {
        try {
          const { v2: cloudinary } = await import("cloudinary");
          cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
          await cloudinary.api.delete_resources(publicIds);
        } catch { /* ignore */ }
      }
    }
    const result = await PhotoModel.deleteMany({ _id: { $in: ids } });
    return res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    req.log.error({ err }, "Bulk delete photo error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
