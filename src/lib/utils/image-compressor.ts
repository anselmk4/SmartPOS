/**
 * Client-Side Smart Image Compressor
 * Resizes and compresses any camera photo or heavy file (5MB, 10MB, 20MB+)
 * into a lightweight, ultra-crisp WebP/JPEG Base64 data URL in < 50ms without cropping.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg" | "image/png";
  maxSizeBytes?: number; // Target max size in bytes (e.g. 300 * 1024 = 300 KB)
}

/**
 * Compresses an image File or Blob into an optimized Base64 Data URL.
 */
export async function compressImageFile(
  file: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 900,
    maxHeight = 900,
    quality = 0.82,
    mimeType = "image/webp",
    maxSizeBytes = 400 * 1024, // 400 KB target
  } = options;

  return new Promise((resolve, reject) => {
    // If not in browser, return empty
    if (typeof window === "undefined") {
      resolve("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        let { width, height } = img;

        // Proportional scale to fit within maxWidth / maxHeight
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { willReadFrequently: false });
        if (!ctx) {
          // Fallback to reading raw file if canvas fails
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
          return;
        }

        // High quality bicubic-like smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG if browser doesn't support WebP canvas export
        let outputMime = mimeType;
        let dataUrl = canvas.toDataURL(outputMime, quality);

        if (!dataUrl.startsWith(`data:${outputMime}`) && outputMime === "image/webp") {
          outputMime = "image/jpeg";
          dataUrl = canvas.toDataURL(outputMime, quality);
        }

        // If result is still above maxSizeBytes, do a second fast pass with lower quality
        const estimatedSize = (dataUrl.length * 3) / 4;
        if (estimatedSize > maxSizeBytes && quality > 0.6) {
          dataUrl = canvas.toDataURL(outputMime, 0.65);
        }

        resolve(dataUrl);
      } catch (err) {
        console.warn("[ImageCompressor] Canvas compression failed, falling back to raw reader:", err);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      console.warn("[ImageCompressor] Image load failed:", err);
      // Fallback to FileReader
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}
