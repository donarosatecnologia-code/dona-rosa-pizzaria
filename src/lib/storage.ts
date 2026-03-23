import { supabase } from "@/integrations/supabase/client";

export async function uploadImage(file: File, folder: string = "general"): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from("images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data } = supabase.storage.from("images").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteImage(url: string): Promise<boolean> {
  const path = url.split("/storage/v1/object/public/images/")[1];
  if (!path) return false;
  const { error } = await supabase.storage.from("images").remove([path]);
  return !error;
}
