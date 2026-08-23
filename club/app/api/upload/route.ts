// POST /api/upload — accepts a multipart file (image/video/audio) and
// stores it on Cloudinary, returning its public URL.
//
// HISTORY: this route used to write files to public/uploads on the local
// filesystem. That works on a traditional always-on server, but breaks on
// platforms with an ephemeral or read-only filesystem (Vercel, most
// serverless hosts): every uploaded file disappears on the next deploy,
// so returned URLs eventually 404. Cloudinary gives persistent, CDN-backed
// storage instead, so uploads survive deploys and scale-to-zero.
//
// Requires CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
// to be set — see lib/cloudinary.ts.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

const ALLOWED_PREFIXES = ["image/", "video/", "audio/"] as const;
// image/svg+xml is deliberately excluded even though it matches the
// "image/" prefix: SVGs can embed <script> and are a known stored-XSS
// vector if the returned Cloudinary URL is later opened directly rather
// than only rendered inside an <img>. Nothing in this app needs user-
// uploaded SVGs (photos/avatars/media only), so it's excluded outright
// rather than relying on Cloudinary account settings to sandbox it.
const BLOCKED_IMAGE_TYPES = new Set(["image/svg+xml"]);
const MAX_SIZE_BY_KIND: Record<string, number> = {
  "image/": 10 * 1024 * 1024, // 10MB
  "video/": 100 * 1024 * 1024, // 100MB
  "audio/": 25 * 1024 * 1024, // 25MB
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: "Non autorisé" }, { status: auth.status });
    }

    if (!isCloudinaryConfigured) {
      console.error(
        "Cloudinary env vars missing (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET)."
      );
      return NextResponse.json(
        { error: "Le stockage des fichiers n'est pas configuré côté serveur (Cloudinary)." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (BLOCKED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Le format SVG n'est pas autorisé" },
        { status: 400 }
      );
    }

    const prefix = ALLOWED_PREFIXES.find((p) => file.type.startsWith(p));
    if (!prefix) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé (image, vidéo ou audio uniquement)" },
        { status: 400 }
      );
    }

    const maxSize = MAX_SIZE_BY_KIND[prefix];
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${Math.round(maxSize / (1024 * 1024))}MB)` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const mediaType = prefix === "image/" ? "image" : prefix === "video/" ? "video" : "audio";
    // Cloudinary has no dedicated "audio" resource type — audio files go
    // through the "video" pipeline (it handles any audio codec fine).
    const cloudinaryResourceType = prefix === "image/" ? "image" : "video";

    let result;
    try {
      result = await uploadBufferToCloudinary(buffer, {
        folder: "club-gammarth",
        resourceType: cloudinaryResourceType,
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return NextResponse.json({ error: "Échec du téléversement vers le stockage" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      filename: result.public_id,
      url: result.secure_url,
      size: result.bytes,
      mimeType: file.type,
      mediaType,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Échec du téléversement" }, { status: 500 });
  }
}
