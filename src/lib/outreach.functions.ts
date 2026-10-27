import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function requireSuperAdmin(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: u, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !u.user) throw new Error("Please sign in again");
  const { data: ok } = await supabaseAdmin.rpc("is_super_admin", { _user_id: u.user.id });
  if (!ok) throw new Error("Only super admins can manage outreach");
  return supabaseAdmin;
}

const base = z.object({ token: z.string().min(10), campaignId: z.string().uuid() });

export const sendOutreachTest = createServerFn({ method: "POST" })
  .inputValidator((d) => base.extend({ testEmail: z.string().trim().email().max(255) }).parse(d))
  .handler(async ({ data }) => {
    const db = await requireSuperAdmin(data.token);
    const { sendTest } = await import("./outreachSender.server");
    return sendTest(db, data.campaignId, data.testEmail);
  });

/** Sends one chunk; the admin UI calls it repeatedly until remaining is 0. */
export const dispatchOutreachChunk = createServerFn({ method: "POST" })
  .inputValidator((d) => base.parse(d))
  .handler(async ({ data }) => {
    const db = await requireSuperAdmin(data.token);
    const { dispatchChunk } = await import("./outreachSender.server");
    return dispatchChunk(db, data.campaignId);
  });

export const pauseOutreachCampaign = createServerFn({ method: "POST" })
  .inputValidator((d) => base.parse(d))
  .handler(async ({ data }) => {
    const db = await requireSuperAdmin(data.token);
    await db.from("outreach_campaigns").update({ status: "paused" }).eq("id", data.campaignId).eq("status", "sending");
    return { ok: true };
  });

export const resumeOutreachCampaign = createServerFn({ method: "POST" })
  .inputValidator((d) => base.parse(d))
  .handler(async ({ data }) => {
    const db = await requireSuperAdmin(data.token);
    await db.from("outreach_campaigns").update({ status: "sending" }).eq("id", data.campaignId).eq("status", "paused");
    return { ok: true };
  });
