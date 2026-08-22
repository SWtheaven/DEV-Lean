import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") || "";
const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET") || "";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const encoder = new TextEncoder();

const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const securityHeaders = { "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "permissions-policy": "camera=(), microphone=(), geolocation=()" };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...jsonHeaders, ...securityHeaders } });
}
function text(data: string, contentType: string) {
  return new Response(data, { headers: { "content-type": contentType, "cache-control": "no-cache", ...securityHeaders } });
}
function b64url(bytes: Uint8Array) {
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function sha256Hex(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function walletFromRequest(req: Request) {
  const token = req.headers.get("x-wallet-token")?.trim();
  if (!token || token.length < 20) return null;
  const hash = await sha256Hex(token);
  const { data } = await supabase.from("confirma_wallets").select("id,balance,created_at").eq("access_token_hash", hash).maybeSingle();
  if (!data) return null;
  await supabase.from("confirma_wallets").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
  return data;
}
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0; for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i); return out === 0;
}
async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function validateMpSignature(req: Request, url: URL) {
  if (!MP_WEBHOOK_SECRET) return false;
  const xSignature = req.headers.get("x-signature") || "";
  const requestId = req.headers.get("x-request-id") || "";
  const dataId = url.searchParams.get("data.id") || url.searchParams.get("data_id") || "";
  const parts = Object.fromEntries(xSignature.split(",").map(x => x.trim().split("=", 2)).filter(x => x.length === 2));
  const ts = parts.ts || ""; const v1 = parts.v1 || "";
  if (!ts || !v1 || !requestId || !dataId) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  return constantTimeEqual(await hmacHex(MP_WEBHOOK_SECRET, manifest), v1);
}
async function readAsset(name: string) {
  return await Deno.readTextFile(new URL(`./public/${name}`, import.meta.url));
}

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const root = "/functions/v1/confirma";
    const path = url.pathname.startsWith(root) ? url.pathname.slice(root.length) || "/" : url.pathname;

    if (req.method === "GET" && (path === "/" || path === "/index.html")) return text(await readAsset("index.html"), "text/html; charset=utf-8");
    if (req.method === "GET" && path === "/styles.css") return text(await readAsset("styles.css"), "text/css; charset=utf-8");
    if (req.method === "GET" && path === "/app.js") return text(await readAsset("app.js"), "application/javascript; charset=utf-8");

    if (req.method === "GET" && path === "/api/packages") {
      const { data, error } = await supabase
        .from("confirma_packages")
        .select("code,label,credits,price_cents,description,recommended,sort_order,static_checkout_url")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return json({ packages: data });
    }

    if (req.method === "POST" && path === "/api/wallet") {
      const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
      const token = b64url(tokenBytes);
      const hash = await sha256Hex(token);
      const { data, error } = await supabase.from("confirma_wallets").insert({ access_token_hash: hash }).select("id,balance,created_at").single();
      if (error) throw error;
      return json({ wallet: data, access_token: token }, 201);
    }

    if (req.method === "GET" && path === "/api/wallet") {
      const wallet = await walletFromRequest(req);
      if (!wallet) return json({ error: "WALLET_UNAUTHORIZED" }, 401);
      return json({ wallet });
    }

    if (req.method === "POST" && path === "/api/checkout") {
      const wallet = await walletFromRequest(req);
      if (!wallet) return json({ error: "WALLET_UNAUTHORIZED" }, 401);
      if (!MP_ACCESS_TOKEN) return json({ error: "MP_NOT_CONFIGURED", message: "Mercado Pago server credentials are pending." }, 503);
      const body = await req.json().catch(() => ({}));
      const packageCode = String(body.package_code || "");
      const { data: pkg } = await supabase.from("confirma_packages").select("code,label,credits,price_cents,description,static_checkout_url").eq("code", packageCode).eq("active", true).maybeSingle();
      if (!pkg) return json({ error: "INVALID_PACKAGE" }, 400);
      const { data: order, error: orderError } = await supabase.from("confirma_orders").insert({ wallet_id: wallet.id, package_code: pkg.code, expected_price_cents: pkg.price_cents, expected_credits: pkg.credits }).select("id").single();
      if (orderError) throw orderError;
      const returnUrl = `${SUPABASE_URL}${root}/?payment_return=1&order=${order.id}`;
      const notificationUrl = `${SUPABASE_URL}${root}/api/webhook`;
      const preferencePayload = {
        items: [{ id: pkg.code, title: `LucronomIA Confirma — ${pkg.label}`, description: pkg.description, quantity: 1, currency_id: "BRL", unit_price: pkg.price_cents / 100 }],
        external_reference: order.id,
        back_urls: { success: returnUrl, pending: returnUrl, failure: returnUrl },
        auto_return: "approved",
        notification_url: notificationUrl,
        metadata: { package_code: pkg.code, order_id: order.id }
      };
      const mp = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: { authorization: `Bearer ${MP_ACCESS_TOKEN}`, "content-type": "application/json", "x-idempotency-key": order.id },
        body: JSON.stringify(preferencePayload)
      });
      const mpData = await mp.json().catch(() => ({}));
      if (!mp.ok || !mpData.id || !mpData.init_point) {
        await supabase.from("confirma_orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", order.id);
        return json({ error: "MP_PREFERENCE_FAILED", provider_status: mp.status }, 502);
      }
      await supabase.from("confirma_orders").update({ status: "pending", provider_preference_id: mpData.id, updated_at: new Date().toISOString() }).eq("id", order.id);
      await supabase.from("confirma_events").insert({ wallet_id: wallet.id, event_name: "payment_started", properties: { order_id: order.id, package_code: pkg.code } });
      return json({ order_id: order.id, checkout_url: mpData.init_point, package: pkg });
    }

    if (req.method === "GET" && path === "/api/payment-status") {
      const wallet = await walletFromRequest(req);
      if (!wallet) return json({ error: "WALLET_UNAUTHORIZED" }, 401);
      const orderId = url.searchParams.get("order") || "";
      const { data: order } = await supabase.from("confirma_orders").select("id,status,package_code,expected_credits,approved_at").eq("id", orderId).eq("wallet_id", wallet.id).maybeSingle();
      if (!order) return json({ error: "ORDER_NOT_FOUND" }, 404);
      const { data: freshWallet } = await supabase.from("confirma_wallets").select("balance").eq("id", wallet.id).single();
      return json({ order, balance: freshWallet?.balance ?? wallet.balance });
    }

    if (req.method === "POST" && path === "/api/finalize") {
      const wallet = await walletFromRequest(req);
      if (!wallet) return json({ error: "WALLET_UNAUTHORIZED" }, 401);
      const body = await req.json().catch(() => ({}));
      const clientId = String(body.client_confirmation_id || "").trim();
      const payload = body.payload;
      if (clientId.length < 8 || clientId.length > 120 || !payload || typeof payload !== "object") return json({ error: "INVALID_CONFIRMATION" }, 400);
      const { data, error } = await supabase.rpc("confirma_finalize_confirmation", { p_wallet_id: wallet.id, p_client_confirmation_id: clientId, p_payload: payload });
      if (error) {
        if (String(error.message).includes("INSUFFICIENT_CREDITS")) return json({ error: "INSUFFICIENT_CREDITS" }, 409);
        throw error;
      }
      const result = data?.[0];
      await supabase.from("confirma_events").insert({ wallet_id: wallet.id, event_name: "confirmation_finalized", properties: { confirmation_id: result?.confirmation_id, consumed: result?.consumed, balance: result?.balance } });
      return json(result || {});
    }

    if (req.method === "GET" && path.startsWith("/api/confirmation/")) {
      const wallet = await walletFromRequest(req);
      if (!wallet) return json({ error: "WALLET_UNAUTHORIZED" }, 401);
      const id = path.split("/").pop() || "";
      const { data } = await supabase.from("confirma_confirmations").select("id,payload,finalized_at").eq("id", id).eq("wallet_id", wallet.id).maybeSingle();
      if (!data) return json({ error: "CONFIRMATION_NOT_FOUND" }, 404);
      return json({ confirmation: data });
    }

    if (req.method === "POST" && path === "/api/event") {
      const wallet = await walletFromRequest(req);
      const body = await req.json().catch(() => ({}));
      const eventName = String(body.event_name || "").slice(0, 80);
      if (!eventName) return json({ error: "INVALID_EVENT" }, 400);
      await supabase.from("confirma_events").insert({ wallet_id: wallet?.id || null, event_name: eventName, properties: body.properties && typeof body.properties === "object" ? body.properties : {} });
      return new Response(null, { status: 204 });
    }

    if (req.method === "POST" && path === "/api/webhook") {
      if (!MP_ACCESS_TOKEN || !MP_WEBHOOK_SECRET) return json({ error: "MP_NOT_CONFIGURED" }, 503);
      if (!(await validateMpSignature(req, url))) return json({ error: "INVALID_WEBHOOK_SIGNATURE" }, 401);
      const body = await req.json().catch(() => ({}));
      if (String(body.type || "") !== "payment") return json({ ok: true });
      const paymentId = String(body?.data?.id || url.searchParams.get("data.id") || "");
      if (!paymentId) return json({ error: "PAYMENT_ID_MISSING" }, 400);
      const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { authorization: `Bearer ${MP_ACCESS_TOKEN}` } });
      const payment = await paymentRes.json().catch(() => ({}));
      if (!paymentRes.ok) return json({ error: "MP_PAYMENT_LOOKUP_FAILED" }, 502);
      const orderId = String(payment.external_reference || "");
      if (!orderId) return json({ error: "EXTERNAL_REFERENCE_MISSING" }, 400);
      const { data: order } = await supabase.from("confirma_orders").select("id,wallet_id,expected_price_cents,expected_credits,package_code,status").eq("id", orderId).maybeSingle();
      if (!order) return json({ error: "ORDER_NOT_FOUND" }, 404);
      const amountCents = Math.round(Number(payment.transaction_amount || 0) * 100);
      if (String(payment.currency_id || "") !== "BRL" || amountCents !== order.expected_price_cents) return json({ error: "PAYMENT_MISMATCH" }, 409);
      if (String(payment.status || "") !== "approved") {
        const mapped = ["rejected", "cancelled"].includes(String(payment.status)) ? String(payment.status) : "pending";
        await supabase.from("confirma_orders").update({ status: mapped, updated_at: new Date().toISOString() }).eq("id", order.id).neq("status", "approved");
        return json({ ok: true, status: mapped });
      }
      const { data, error } = await supabase.rpc("confirma_apply_approved_payment", { p_order_id: order.id, p_provider_payment_id: paymentId, p_amount_cents: amountCents });
      if (error) throw error;
      const result = data?.[0];
      if (result?.applied) {
        await supabase.from("confirma_events").insert([
          { wallet_id: order.wallet_id, event_name: "payment_approved", properties: { order_id: order.id, payment_id: paymentId, package_code: order.package_code } },
          { wallet_id: order.wallet_id, event_name: "credits_added", properties: { order_id: order.id, credits: result.credits_added, balance: result.balance } }
        ]);
      }
      return json({ ok: true, ...result });
    }

    return json({ error: "NOT_FOUND" }, 404);
  } catch (error) {
    console.error(error);
    return json({ error: "INTERNAL_ERROR" }, 500);
  }
});
