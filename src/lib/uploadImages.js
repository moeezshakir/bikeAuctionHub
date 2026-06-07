const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".heif",
  ".jfif",
  ".bmp",
  ".avif",
]);

const MIME_TO_EXTENSION = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/bmp": ".bmp",
  "image/avif": ".avif",
};

export function resolveUploadExtension(file) {
  const fromName = String(file?.name || "")
    .toLowerCase()
    .match(/(\.[a-z0-9]+)$/)?.[1];
  if (fromName && ALLOWED_UPLOAD_EXTENSIONS.has(fromName)) {
    return fromName;
  }

  const fromMime = MIME_TO_EXTENSION[String(file?.type || "").toLowerCase()];
  if (fromMime) {
    return fromMime;
  }

  return fromName || "";
}

export function isAllowedUploadFile(file) {
  if (!file) return false;
  const ext = resolveUploadExtension(file);
  return ALLOWED_UPLOAD_EXTENSIONS.has(ext);
}

export function getUploadValidationError(files) {
  const list = (Array.isArray(files) ? files : [files]).filter(Boolean);
  const invalid = list.filter((file) => !isAllowedUploadFile(file));
  if (!invalid.length) return null;

  const names = invalid.map((file) => file.name || "Unknown file").join(", ");
  return `Unsupported photo format: ${names}. Use JPG, PNG, WEBP, GIF, HEIC, or BMP.`;
}

export { ALLOWED_UPLOAD_EXTENSIONS, MIME_TO_EXTENSION };
