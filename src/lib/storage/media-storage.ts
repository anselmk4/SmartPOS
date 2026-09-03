/**
 * Client-side helper for uploading and processing media files (photos, logos, receipts)
 * Supports both online Supabase CDN upload and instant offline Base64 fallback.
 */

export interface UploadMediaResult {
  url: string;
  isCloudUrl: boolean;
  error?: string;
}

export async function uploadMediaFile(
  base64Data: string,
  options: {
    folder?: "products" | "branding" | "expenses";
    fileName?: string;
  } = {}
): Promise<UploadMediaResult> {
  const { folder = "products", fileName } = options;

  // 1. If offline, immediately return local Base64 string for zero-latency offline usage
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      url: base64Data,
      isCloudUrl: false,
    };
  }

  // 2. If online, upload to Supabase Storage via /api/v1/storage/upload
  try {
    const isNative = typeof window !== "undefined" && Boolean((window as any).Capacitor?.isNativePlatform?.());
    let apiUrl = "/api/v1/storage/upload";
    if (isNative) {
      const customUrl = typeof window !== "undefined" ? localStorage.getItem("pos_custom_api_url") : null;
      const envUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (customUrl) {
        apiUrl = `${customUrl.replace(/\/+$/, "")}/api/v1/storage/upload`;
      } else if (envUrl && !envUrl.includes("globalpos.app")) {
        apiUrl = `${envUrl.replace(/\/+$/, "")}/api/v1/storage/upload`;
      } else if (typeof window !== "undefined" && window.location.origin && !window.location.origin.startsWith("capacitor:") && !window.location.origin.startsWith("http://localhost")) {
        apiUrl = `${window.location.origin}/api/v1/storage/upload`;
      }
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64Data,
        fileName,
        folder,
      }),
    });

    if (!response.ok) {
      throw new Error(`Upload failed (${response.status})`);
    }

    const data = await response.json();
    if (data.success && data.url) {
      return {
        url: data.url,
        isCloudUrl: !data.storageFallback,
      };
    }

    return {
      url: base64Data,
      isCloudUrl: false,
    };
  } catch (err: any) {
    console.warn("[MediaStorage] Supabase Storage upload fallback to local:", err.message);
    // Fallback to local Base64 without blocking the user
    return {
      url: base64Data,
      isCloudUrl: false,
    };
  }
}
