// POST-only event inquiry intake: validates, stores one private JSON record per lead in the
// igolf32-leads Vercel Blob store, then (if configured) sends an internal alert via Resend.
// There is deliberately no read/list endpoint; leads are read with the Vercel CLI/dashboard.
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

const OCCASIONS = ["Corporate Event", "Holiday Party", "Birthday", "Bachelor / Bachelorette", "League / Tournament", "Just Golf", "Other"];
const ALLOWED_HOSTS = ["igolf32.com", "www.igolf32.com"];
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const hits = new Map(); // best-effort, per warm instance

function clean(v, max) { return typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : ""; }
function rateLimited(ip) {
  const now = Date.now(); const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now); hits.set(ip, arr); return arr.length > RATE_MAX;
}
function originAllowed(req) {
  const o = req.headers.origin; if (!o) return true;
  try { const h = new URL(o).hostname; return ALLOWED_HOSTS.includes(h) || /^igolf32-emergency-site-[a-z0-9]+-mlees-projects\.vercel\.app$/.test(h); } catch { return false; }
}
async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 20000) throw new Error("too_large"); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function sendAlert(lead) {
  const key = process.env.RESEND_API_KEY; const from = process.env.INQUIRY_ALERT_FROM; const to = process.env.INQUIRY_ALERT_TO || "hello@igolf32.com";
  if (!key || !from) return { status: "skipped" };
  const subject = `New iGolf event inquiry - ${lead.occasion || "Event"} - ${lead.date || "date TBD"}`;
  const text = [
    "New event inquiry from igolf32.com", "",
    `Name: ${lead.name}`, `Email: ${lead.email}`, `Phone: ${lead.phone || "-"}`, `Date: ${lead.date || "-"}`, `Time: ${lead.time || "-"}`,
    `Party size: ${lead.party_size || "-"}`, `Occasion: ${lead.occasion || "-"}`, "", "Notes:", lead.notes || "-", "",
    `Submitted: ${lead.submitted_at}`, `Page: ${lead.page || "-"}`, `Referrer: ${lead.referrer || "-"}`,
    `UTM: ${Object.entries(lead.utm).map(([k, v]) => `${k}=${v}`).join(" ") || "-"}`, `Record: ${lead.id}`,
  ].join("\n");
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text, reply_to: lead.email }),
    });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { status: "sent", provider_id: j.id || null } : { status: "failed", http: r.status };
  } catch { return { status: "failed" }; }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false, error: "method_not_allowed" }); }
  if (!originAllowed(req)) return res.status(403).json({ ok: false, error: "forbidden" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: "rate_limited" });
  let b; try { b = await readBody(req); } catch { return res.status(400).json({ ok: false, error: "bad_request" }); }
  if (clean(b.website, 200)) return res.status(200).json({ ok: true }); // honeypot: silently accept, store nothing

  const lead = {
    name: clean(b.name, 100), email: clean(b.email, 200).toLowerCase(), phone: clean(b.phone, 40),
    date: clean(b.date, 10), time: clean(b.time, 5), party_size: clean(String(b.party ?? ""), 4),
    occasion: clean(b.occasion, 40), notes: clean(b.notes, 2000), page: clean(b.page, 300), referrer: clean(b.referrer, 300),
    utm: {},
  };
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"]) { const v = clean(b[k], 200); if (v) lead.utm[k] = v; }
  const errors = [];
  if (!lead.name) errors.push("name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) errors.push("email");
  if (lead.date && !/^\d{4}-\d{2}-\d{2}$/.test(lead.date)) errors.push("date");
  if (!lead.date) errors.push("date");
  if (lead.time && !/^\d{2}:\d{2}$/.test(lead.time)) errors.push("time");
  if (lead.party_size && !/^\d{1,4}$/.test(lead.party_size)) errors.push("party");
  if (lead.occasion && !OCCASIONS.includes(lead.occasion)) errors.push("occasion");
  if (lead.phone && !/^[0-9+().\-\s]{7,40}$/.test(lead.phone)) errors.push("phone");
  if (errors.length) return res.status(422).json({ ok: false, error: "invalid", fields: errors });

  const now = new Date(); lead.submitted_at = now.toISOString(); lead.id = randomUUID();
  lead.user_agent = clean(String(req.headers["user-agent"] || ""), 300);
  const pathname = `leads/${lead.submitted_at.slice(0, 10)}/${lead.submitted_at.replace(/[:.]/g, "-")}_${lead.id}.json`;
  try {
    await put(pathname, JSON.stringify(lead, null, 2), { access: "private", contentType: "application/json", addRandomSuffix: false });
  } catch (e) {
    console.error("inquiry_store_failed", e && e.message);
    return res.status(503).json({ ok: false, error: "store_failed" });
  }
  const alert = await sendAlert(lead);
  console.log("inquiry_stored", JSON.stringify({ id: lead.id, pathname, alert }));
  return res.status(201).json({ ok: true, id: lead.id });
}
