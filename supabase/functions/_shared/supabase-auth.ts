import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.100.0";

export class AuthError extends Error {
  status: number;
  code: string;

  constructor(code: string, status = 401) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export interface AdminContext {
  userId: string;
  userClient: SupabaseClient;
}

/** Valida JWT do caller e exige role admin via RPC am_i_admin. */
export async function requireAdmin(req: Request): Promise<AdminContext> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("missing_auth", 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_OR_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    throw new AuthError("missing_supabase_env", 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    throw new AuthError("invalid_auth", 401);
  }

  const { data: isAdmin, error: adminError } = await userClient.rpc("am_i_admin");

  if (adminError || !isAdmin) {
    throw new AuthError("not_admin", 403);
  }

  return { userId: userData.user.id, userClient };
}

export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRole) {
    throw new AuthError("missing_service_role", 500);
  }

  return createClient(supabaseUrl, serviceRole);
}
