/**
 * Konfigurasi layanan eksternal.
 * Nilai default aman untuk dipublikasikan (publishable key & upload preset).
 * Dapat ditimpa melalui environment variable VITE_*.
 */

const read = (key: string, fallback: string): string => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return value && value.length > 0 ? value : fallback;
};

export const env = {
  supabaseUrl: read("VITE_SUPABASE_URL", "https://ihcxyatlhgmyhiecghcn.supabase.co"),
  supabasePublishableKey: read(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "sb_publishable_OeVYFm-H9QhiRBrB-wTAbw_TfqmUya1",
  ),
  cloudinaryCloudName: read("VITE_CLOUDINARY_CLOUD_NAME", "iwcvk9dw"),
  cloudinaryUploadPreset: read("VITE_CLOUDINARY_UPLOAD_PRESET", "aquilacafe_upload"),
} as const;

export const appConfig = {
  name: "LPK Learning",
  shortName: "LPK LMS",
  description: "Platform pembelajaran multi-tenant untuk Lembaga Pelatihan Kerja.",
  locale: "id-ID",
} as const;
