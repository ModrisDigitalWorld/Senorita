import { Router, type Request, type Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { authMiddleware, adminOnly } from "../middlewares/auth.js";

const router = Router();

function makeAiClient() {
  const proxyUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const isDevProxy = proxyUrl && proxyUrl.includes("localhost");

  if (isDevProxy) {
    return new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
      httpOptions: { baseUrl: proxyUrl, apiVersion: "" },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!apiKey) throw new Error("No Gemini API key configured");

  return new GoogleGenAI({ apiKey });
}

router.post("/ai/generate-description", authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { name, images = [], category, price, tags = [] } = req.body;
    const ai = makeAiClient();

    const parts: any[] = [];

    if (images.length > 0) {
      for (const url of images.slice(0, 3)) {
        try {
          const imgRes = await fetch(url);
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
            parts.push({ inlineData: { data: base64, mimeType } });
          }
        } catch {}
      }
    }

    const prompt = `You are a product copywriter for Senorita, a trendy women's fashion store in India. 
Write a compelling, concise product description (2-3 sentences, max 120 words) for this item.
Product name: ${name}
${category ? `Category: ${category}` : ""}
${price ? `Price: ₹${price}` : ""}
${tags.length ? `Tags: ${tags.join(", ")}` : ""}
${images.length ? "Analyze the product images provided above." : ""}

Write in a warm, fashionable tone. Highlight style, fit, occasion, and fabric feel where relevant.
Focus on what makes it desirable. Do NOT mention the brand name in the description.
Return ONLY the description text, no quotes or extra formatting.`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: { maxOutputTokens: 8192 },
    });

    const description = response.text?.trim() || "";
    res.json({ description });
  } catch (err) {
    console.error("AI description error:", err);
    res.status(500).json({ error: "Failed to generate description" });
  }
});

export default router;
