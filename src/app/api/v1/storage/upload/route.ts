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

    const buffer = Buffer.from(pureBase64, "base64");
    const ext = mimeType.split("/")[1] || "jpg";
    const safeFileName = fileName
      ? `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const filePath = `${folder}/${safeFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: mimeType,
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
