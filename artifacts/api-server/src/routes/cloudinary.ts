import { Router, type IRouter, type Request, type Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const API_KEY    = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

// Log configuration status on startup (no secret values exposed)
const missing = [
  !CLOUD_NAME && "CLOUDINARY_CLOUD_NAME",
  !API_KEY    && "CLOUDINARY_API_KEY",
  !API_SECRET && "CLOUDINARY_API_SECRET",
].filter(Boolean);

if (missing.length) {
  console.error("[cloudinary] ⚠️  Missing env vars:", missing.join(", "));
} else if (API_KEY === CLOUD_NAME) {
  console.error("[cloudinary] ⚠️  CLOUDINARY_API_KEY equals CLOUDINARY_CLOUD_NAME — secrets appear swapped!");
} else {
  console.log("[cloudinary] ✓ credentials loaded — cloud:", CLOUD_NAME, "key ends:", API_KEY.slice(-4));
}

cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post("/cloudinary/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    console.log("[upload] incoming file:", req.file?.originalname, req.file?.size, req.file?.mimetype);
    if (!req.file) {
      console.log("[upload] no file in request, body keys:", Object.keys(req.body || {}));
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const { alt = "", title = "" } = req.body ?? {};
    const context: Record<string, string> = {};
    if (alt) context.alt = alt;
    if (title) context.caption = title;

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "senorita/products",
          resource_type: "image",
          ...(Object.keys(context).length > 0 ? { context } : {}),
        },
        (error, result) => {
          if (error) {
            console.error("[upload] Cloudinary error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      stream.end(req.file!.buffer);
    });

    console.log("[upload] success:", result.secure_url);
    res.json({ secure_url: result.secure_url, public_id: result.public_id });
  } catch (err: any) {
    const msg: string = err?.message || "Upload failed";
    console.error("Cloudinary upload error:", msg);
    const friendly = msg.includes("Unknown API key") || msg.includes("Invalid API key")
      ? "Image upload service is misconfigured — please contact support."
      : msg.includes("Invalid image file")
        ? "The selected file is not a valid image. Please try a JPG or PNG."
        : msg;
    res.status(500).json({ error: friendly });
  }
});

router.post("/cloudinary/sign", async (req: Request, res: Response) => {
  try {
    const { folder = "senorita/products", public_id, context } = req.body ?? {};
    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign: Record<string, any> = { timestamp, folder };
    if (public_id) paramsToSign.public_id = public_id;
    if (context) paramsToSign.context = context;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    res.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    });
  } catch (err) {
    console.error("Cloudinary sign error:", err);
    res.status(500).json({ error: "Failed to generate signature" });
  }
});

router.delete("/cloudinary/delete", async (req: Request, res: Response) => {
  try {
    const { public_id } = req.body ?? {};
    if (!public_id) {
      res.status(400).json({ error: "public_id required" });
      return;
    }
    const result = await cloudinary.uploader.destroy(public_id);
    res.json(result);
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

export default router;
