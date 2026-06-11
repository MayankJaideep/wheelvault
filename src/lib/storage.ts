import { supabase } from "@/integrations/supabase/client";

export const LISTING_BUCKET = "listing-images";

/** Admin-only: upload a file to listing-images. Returns the storage path. */
export async function uploadListingImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(LISTING_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export async function deleteListingImage(path: string): Promise<void> {
  await supabase.storage.from(LISTING_BUCKET).remove([path]);
}
