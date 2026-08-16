import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/supabase-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET_NAME = "smartpos-media";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { base64Data, fileName, folder = "products" } = body;

    if (!base64Data) {
      return NextResponse.json(
        { success: false, error: "Données de fichier manquantes (base64Data requis)" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check if bucket exists, create if not
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
      if (!bucketExists) {
        await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
        });
      }
    } catch {
      // Ignore if already created or permission constrained
    }

    // Convert Base64 data to Buffer
    let mimeType = "image/jpeg";
    let pureBase64 = base64Data;

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      pureBase64 = matches[2];
    }

    // Enforce 3MB max file size limit
    const buffer = Buffer.from(pureBase64, "base64");
    if (buffer.length > 3 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Fichier trop volumineux (Taille maximale autorisée : 3 Mo)" },
        { status: 400 }
      );
    }

    // Validate real image magic bytes (JPEG: FF D8 FF, PNG: 89 50 4E 47, WEBP: 52 49 46 46, SVG: <svg)
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isSvg = buffer.slice(0, 100).toString().includes("<svg");

    if (!isJpeg && !isPng && !isWebp && !isSvg) {
      return NextResponse.json(
        { success: false, error: "Type de fichier non autorisé. Seules les images réelles (JPG, PNG, WEBP, SVG) sont acceptées." },
        { status: 400 }
      );
    }

    const ext = isPng ? "png" : isWebp ? "webp" : isSvg ? "svg" : "jpg";
    const safeFileName = fileName
      ? `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const filePath = `${folder}/${safeFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: isPng ? "image/png" : isWebp ? "image/webp" : isSvg ? "image/svg+xml" : "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.warn("[Supabase Storage] Upload warning:", uploadError.message);
      // If storage upload fails (e.g. key missing), return original base64 as fallback
      return NextResponse.json({
        success: true,
        url: base64Data,
        storageFallback: true,
        message: "Enregistré en mode local/base64",
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: uploadData.path,
    });
  } catch (error: any) {
    console.error("[Storage Upload API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors du téléversement" },
      { status: 500 }
    );
  }
}
