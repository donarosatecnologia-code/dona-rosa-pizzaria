/**
 * Ping diário ao Postgres via REST (service role) para manter o projeto ativo.
 * Protegida por KEEP_ALIVE_SECRET (query ?secret=) — defina em: supabase secrets set --env-file ...
 */
Deno.serve(async (req: Request) => {
  const expected = Deno.env.get("KEEP_ALIVE_SECRET");
  const provided = new URL(req.url).searchParams.get("secret");

  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ error: "missing_env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/nav_links?select=id&limit=1`, {
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    return new Response(JSON.stringify({ ok: false, status: res.status, detail }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, pinged_at: new Date().toISOString() }),
    { headers: { "Content-Type": "application/json" } },
  );
});
