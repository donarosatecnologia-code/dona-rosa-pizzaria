import { handleCorsPreflight, jsonWithCors } from "../_shared/cors.ts";
import { AuthError, createServiceClient, requireAdmin } from "../_shared/supabase-auth.ts";

console.info("admin-users started");

interface AdminUsersRequest {
  action?: "list" | "invite" | "update" | "delete" | "resend_invite";
  id?: string;
  email?: string;
  full_name?: string;
  is_active?: boolean;
  permissions?: Record<string, { view?: boolean; edit?: boolean; delete?: boolean }>;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function getSiteUrl(): string {
  return Deno.env.get("PUBLIC_SITE_URL") ?? Deno.env.get("VITE_PUBLIC_SITE_URL") ?? "http://localhost:5173";
}

async function assertCanManageUsers(userClient: ReturnType<typeof createServiceClient>, userId: string) {
  const { data, error } = await userClient.rpc("can_i_manage_users");
  if (error || !data) {
    throw new AuthError("not_allowed", 403);
  }
}

async function listUsers(service: ReturnType<typeof createServiceClient>) {
  const { data: profiles, error } = await service
    .from("users")
    .select("id, full_name, role, is_active, is_super_admin, must_change_password, permissions, created_at, last_login_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const users = [];
  for (const profile of profiles ?? []) {
    const { data: authUser } = await service.auth.admin.getUserById(profile.id);
    users.push({
      ...profile,
      email: authUser.user?.email ?? "",
    });
  }

  return { users };
}

async function inviteUser(
  service: ReturnType<typeof createServiceClient>,
  body: AdminUsersRequest,
) {
  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim();
  const permissions = body.permissions ?? {};

  if (!email || !fullName) {
    return jsonWithCors({ error: "missing_fields" }, 400);
  }

  const tempPassword = generateTempPassword();

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      invited: true,
      must_change_password: true,
      permissions,
    },
  });

  if (createError) {
    return jsonWithCors({ error: createError.message }, 400);
  }

  if (created.user) {
    await service.from("users").update({
      full_name: fullName,
      role: "admin",
      is_active: true,
      must_change_password: true,
      permissions,
    }).eq("id", created.user.id);

    const redirectTo = `${getSiteUrl()}/redefinir-senha`;
    const { error: mailError } = await service.auth.resetPasswordForEmail(email, { redirectTo });
    const emailSent = !mailError;

    return jsonWithCors({
      user_id: created.user.id,
      temp_password: tempPassword,
      email_sent: emailSent,
    });
  }

  return jsonWithCors({ error: "create_failed" }, 500);
}

async function updateUser(
  service: ReturnType<typeof createServiceClient>,
  body: AdminUsersRequest,
) {
  if (!body.id) {
    return jsonWithCors({ error: "missing_id" }, 400);
  }

  const { data: target } = await service
    .from("users")
    .select("is_super_admin")
    .eq("id", body.id)
    .maybeSingle();

  if (!target) {
    return jsonWithCors({ error: "not_found" }, 404);
  }

  const payload: Record<string, unknown> = {};
  if (body.full_name?.trim()) {
    payload.full_name = body.full_name.trim();
  }
  if (typeof body.is_active === "boolean" && !target.is_super_admin) {
    payload.is_active = body.is_active;
  }
  if (body.permissions && !target.is_super_admin) {
    payload.permissions = body.permissions;
  }

  if (Object.keys(payload).length === 0) {
    return jsonWithCors({ error: "nothing_to_update" }, 400);
  }

  const { error } = await service.from("users").update(payload).eq("id", body.id);
  if (error) {
    return jsonWithCors({ error: error.message }, 400);
  }

  if (payload.full_name) {
    await service.auth.admin.updateUserById(body.id, {
      user_metadata: { full_name: payload.full_name },
    });
  }

  return jsonWithCors({ ok: true });
}

async function deleteUser(
  service: ReturnType<typeof createServiceClient>,
  callerId: string,
  id?: string,
) {
  if (!id) {
    return jsonWithCors({ error: "missing_id" }, 400);
  }

  if (id === callerId) {
    return jsonWithCors({ error: "cannot_delete_self" }, 400);
  }

  const { data: target } = await service
    .from("users")
    .select("is_super_admin")
    .eq("id", id)
    .maybeSingle();

  if (!target) {
    return jsonWithCors({ error: "not_found" }, 404);
  }

  if (target.is_super_admin) {
    return jsonWithCors({ error: "cannot_delete_super_admin" }, 403);
  }

  const { error } = await service.auth.admin.deleteUser(id);
  if (error) {
    return jsonWithCors({ error: error.message }, 400);
  }

  return jsonWithCors({ ok: true });
}

async function resendInvite(
  service: ReturnType<typeof createServiceClient>,
  id?: string,
) {
  if (!id) {
    return jsonWithCors({ error: "missing_id" }, 400);
  }

  const { data: authUser, error: authError } = await service.auth.admin.getUserById(id);
  if (authError || !authUser.user?.email) {
    return jsonWithCors({ error: "not_found" }, 404);
  }

  const tempPassword = generateTempPassword();
  const { error: updateError } = await service.auth.admin.updateUserById(id, {
    password: tempPassword,
    user_metadata: { must_change_password: true },
  });

  if (updateError) {
    return jsonWithCors({ error: updateError.message }, 400);
  }

  await service.from("users").update({ must_change_password: true }).eq("id", id);

  const redirectTo = `${getSiteUrl()}/redefinir-senha`;
  const { error: mailError } = await service.auth.resetPasswordForEmail(authUser.user.email, { redirectTo });

  return jsonWithCors({
    temp_password: tempPassword,
    email_sent: !mailError,
  });
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) {
    return preflight;
  }

  if (req.method !== "POST") {
    return jsonWithCors({ error: "method_not_allowed" }, 405);
  }

  let adminCtx;
  try {
    adminCtx = await requireAdmin(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonWithCors({ error: error.code }, error.status);
    }
    throw error;
  }

  let body: AdminUsersRequest;
  try {
    body = await req.json();
  } catch {
    return jsonWithCors({ error: "invalid_json" }, 400);
  }

  const service = createServiceClient();

  try {
    if (body.action === "list") {
      await assertCanManageUsers(adminCtx.userClient, adminCtx.userId);
      const result = await listUsers(service);
      return jsonWithCors(result);
    }

    if (body.action === "invite") {
      await assertCanManageUsers(adminCtx.userClient, adminCtx.userId);
      return await inviteUser(service, body);
    }

    if (body.action === "update") {
      await assertCanManageUsers(adminCtx.userClient, adminCtx.userId);
      return await updateUser(service, body);
    }

    if (body.action === "delete") {
      await assertCanManageUsers(adminCtx.userClient, adminCtx.userId);
      return await deleteUser(service, adminCtx.userId, body.id);
    }

    if (body.action === "resend_invite") {
      await assertCanManageUsers(adminCtx.userClient, adminCtx.userId);
      return await resendInvite(service, body.id);
    }

    return jsonWithCors({ error: "unknown_action" }, 400);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonWithCors({ error: error.code }, error.status);
    }
    const message = error instanceof Error ? error.message : "internal_error";
    return jsonWithCors({ error: message }, 500);
  }
});
