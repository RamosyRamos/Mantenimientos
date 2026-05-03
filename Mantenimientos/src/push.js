
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeUserToPush(session) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    const surl = import.meta.env.VITE_SUPABASE_URL;
    const skey = import.meta.env.VITE_SUPABASE_KEY;
    if (!vapidKey || !surl || !skey) return;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const { endpoint, keys } = sub.toJSON();
    await fetch(`${surl}/rest/v1/push_subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': skey,
        'Authorization': `Bearer ${skey}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: String(session.id),
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }),
    });
  } catch (e) {
    console.warn('Push subscription failed:', e);
  }
}
