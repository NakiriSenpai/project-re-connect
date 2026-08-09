import { createTenantWithAdmin, type CreateTenantPayload } from "@/lib/owner/tenants.functions";

export type { CreateTenantPayload };

/** Membuat tenant + akun admin pertama (dieksekusi di server, khusus Owner). */
export async function createTenant(payload: CreateTenantPayload) {
  return createTenantWithAdmin({ data: payload });
}
