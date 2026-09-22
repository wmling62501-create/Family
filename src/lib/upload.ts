import { supabase } from "@/integrations/supabase/client";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
  MEDIA_BUCKET,
} from "@/lib/constants";

export class UploadError extends Error {
  constructor(
    message: string,
    readonly reason: "type" | "size" | "failed",
  ) {
    super(message);
    this.name = "UploadError";
  }
}

const extensionOf = (file: File) => {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return file.type.split("/").pop() ?? "jpg";
};

/**
 * Upload one image to Enter Cloud Storage and return its public URL.
 * Throws UploadError so callers can map the reason onto a translated message.
 */
export const uploadImage = async (file: File, folder: string) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new UploadError("unsupported image type", "type");
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new UploadError(`image larger than ${MAX_IMAGE_SIZE_MB}MB`, "size");
  }

  const path = `${folder}/${crypto.randomUUID()}.${extensionOf(file)}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new UploadError(error.message, "failed");

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
