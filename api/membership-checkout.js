// Each buyer needs a fresh Square API link: API /order links are single-use.
// Prices and existing tax-free monthly plan variations are server-owned.
import { randomUUID } from "node:crypto";
const PLANS = Object.freeze({
  individual: { name: "Individual Membership (2026)", amount: 32500, id: "M72YXRU6UZ2MI6D2HN23NPVL" },
  family: { name: "Family Membership (2026)", amount: 42500, id: "3WMM4C7V6RV2GBLUUYWSQHQF" },
  premium: { name: "Premium Membership (2026)", amount: 49500, id: "HTOFP4KCY2EGARSY6E4KENTN" },
});
const hits = new Map();
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  const fail = (code, message) => res.status(code).send(message);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fail(405, "Please start checkout from igolf32.com/memberships.html.");
  }
  if (req.headers.origin && !["https://igolf32.com", "https://www.igolf32.com"].includes(req.headers.origin))
    return fail(403, "Please start checkout from igolf32.com/memberships.html.");
  const plan = typeof req.query?.plan === "string" && Object.hasOwn(PLANS, req.query.plan) ? PLANS[req.query.plan] : null;
  if (!plan) return fail(400, "Please choose a membership on igolf32.com/memberships.html.");
  const now = Date.now();
  for (const [key, times] of hits) if (times.at(-1) < now - 60000) hits.delete(key);
  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0];
  const recent = (hits.get(ip) || []).filter(t => t > now - 60000);
  if (recent.length >= 15) { res.setHeader("Retry-After", "60"); return fail(429, "Please wait a minute, then try again."); }
  recent.push(now); hits.set(ip, recent);
  const token = process.env.IGOLF_SQUARE_ACCESS_TOKEN;
  if (!token) return fail(503, "Checkout is temporarily unavailable. Please try again shortly or call (646) 838-4004.");
  const fields = [{ title: "Locker PIN (4-Digit Numerical)" }];
  if (req.query.plan === "family") fields.unshift({ title: "Family Member Name" });
  try {
    const response = await fetch("https://connect.squareup.com/v2/online-checkout/payment-links", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Square-Version": "2025-10-16" },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        idempotency_key: randomUUID(),
        description: "igolf32.com visitor-specific monthly membership checkout",
        quick_pay: { name: plan.name, price_money: { amount: plan.amount, currency: "USD" }, location_id: "LXQGK4TZZG132" },
        checkout_options: { allow_tipping: false, subscription_plan_id: plan.id, custom_fields: fields },
      }),
    });
    const result = await response.json();
    const url = new URL(result.payment_link?.url || "https://invalid.invalid");
    if (!response.ok || url.protocol !== "https:" || url.hostname !== "square.link") throw new Error("checkout_unavailable");
    // Never cache or reuse this one-buyer URL, including after successful payment.
    return res.redirect(303, url.href);
  } catch {
    return fail(502, "We couldn’t open Square checkout. Please return to memberships and try again, or call (646) 838-4004.");
  }
}
