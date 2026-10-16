import sharp from "sharp";
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_JPEG_QUALITY,
  IMAGE_MAX_SIDE_PX,
  IMAGE_WEBP_QUALITY
} from "@/lib/constants";

function extensionFromMime(mimeType) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".jpg";
}

export async function compressImageBuffer(inputBuffer, mimeType) {
  const original = Buffer.from(inputBuffer);

  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return {
      buffer: original,
      contentType: mimeType,
      extension: extensionFromMime(mimeType),
      originalBytes: original.length,
      compressedBytes: original.length
    };
  }

  const resizeOptions = {
    width: IMAGE_MAX_SIDE_PX,
    height: IMAGE_MAX_SIDE_PX,
    fit: "inside",
    withoutEnlargement: true
  };

  const webpBuffer = await sharp(original, { failOn: "none" })
    .rotate()
    .resize(resizeOptions)
    .webp({ quality: IMAGE_WEBP_QUALITY, effort: 4 })
    .toBuffer();

  let bestBuffer = webpBuffer;
  let contentType = "image/webp";
  let extension = ".webp";

  if (webpBuffer.length >= original.length) {
    const jpegBuffer = await sharp(original, { failOn: "none" })
      .rotate()
      .resize(resizeOptions)
      .jpeg({ quality: IMAGE_JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    if (jpegBuffer.length < webpBuffer.length) {
      bestBuffer = jpegBuffer;
      contentType = "image/jpeg";
      extension = ".jpg";
    }
  }

  if (bestBuffer.length >= original.length) {
    return {
      buffer: original,
      contentType: mimeType,
      extension: extensionFromMime(mimeType),
      originalBytes: original.length,
      compressedBytes: original.length
    };
  }

  return {
    buffer: bestBuffer,
    contentType,
    extension,
    originalBytes: original.length,
    compressedBytes: bestBuffer.length
  };
}
