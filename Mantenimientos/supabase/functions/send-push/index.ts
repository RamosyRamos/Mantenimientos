import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const vapidPublic  = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const vapidSubject = Deno.env.get("VAPID_SUBJECT")!;
  const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const db = createClient(supabaseUrl, supabaseKey);

  const { user_ids, title, body, url } = await req.json();

  if (!user_ids?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: subs } = await db
    .from("push_subscriptions")
    .select("*")
    .in("user_id", user_ids.map(String));

  if (!subs?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const payload = JSON.stringify({ title, body, url: url || "/" });
  let sent = 0;
  const stale: string[] = [];

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) stale.push(s.endpoint);
      }
    })
  );

  if (stale.length) {
    await db.from("push_subscriptions").delete().in("endpoint", stale);
  }

  return new Response(JSON.stringify({ sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
