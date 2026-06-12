/**
 * Netlify Function — Admin actions (lock/unlock picks).
 * Protected by ADMIN_SECRET env var (checked server-side).
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS.
 *
 * Required Netlify env vars:
 *   ADMIN_SECRET              — shared with VITE_ADMIN_SECRET in frontend
 *   SUPABASE_URL              — same as VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (never in frontend)
 */

import { createClient } from "@supabase/supabase-js";

export default async function adminAction(req: Request) {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const adminSecret  = process.env.ADMIN_SECRET;
  const supabaseUrl  = process.env.SUPABASE_URL;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!adminSecret || !supabaseUrl || !serviceKey) {
    console.error("Missing required env vars");
    return new Response("Server configuration error", { status: 500 });
  }

  let body: { action: string; secret: string };
  try {
    body = await req.json() as { action: string; secret: string };
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Verify the admin secret
  if (body.secret !== adminSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  if (body.action === "lock" || body.action === "unlock") {
    const locked = body.action === "lock";
    const { error } = await sb
      .from("app_settings")
      .update({ picks_locked: locked })
      .eq("id", true);

    if (error) {
      console.error("Lock/unlock error:", error);
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log(`Picks ${locked ? "locked" : "unlocked"} by admin`);
    return Response.json({ ok: true, picks_locked: locked });
  }

  return new Response("Unknown action", { status: 400 });
}
