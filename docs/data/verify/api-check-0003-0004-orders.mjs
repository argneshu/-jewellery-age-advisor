// Epic 10, Story 10.2 — API-level verification of migrations 0003 (orders, order_items) and 0004
// (place_order) against the DEVELOPMENT Supabase project (aura/.env.local). Run in YOUR terminal:
//
//     node docs/data/verify/api-check-0003-0004-orders.mjs
//
// Needs the same two dev test users as the 0002 check (both signed up, Auto-Confirmed). Passwords are typed
// hidden and never printed; keys/tokens are never printed. Side effects: it creates a few TEST ORDERS for the
// two users in the dev database (orders are immutable from the client by design) — harmless in dev.
// The "no_address" check needs a user WITHOUT a saved address: the script tells you what to do (delete user B's
// row in Table Editor -> user_addresses, then press Enter) or you can type "skip".
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  fs.readFileSync(path.resolve(here, "../../../aura/.env.local"), "utf8").split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) { console.error("Missing Supabase URL/key in aura/.env.local"); process.exit(2); }
const ref = new URL(URL_).host.split(".")[0];
if (ref.startsWith("lexujp")) { console.error("REFUSING: .env.local points at the old PRODUCTION project."); process.exit(2); }
console.log(`Target project ref: ${ref.slice(0, 3)}…${ref.slice(-2)} (dev)\n`);

function ask(q, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) { rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); }; }
    rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(a.trim()); });
  });
}
async function signIn(email, password) {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const b = await r.json();
  if (!r.ok || !b.access_token) throw new Error(`sign-in failed for ${email}: ${b.error_description || b.msg || r.status}`);
  return { token: b.access_token, id: b.user.id };
}
const call = (p, { token, method = "GET", body, prefer } = {}) =>
  fetch(`${URL_}/rest/v1/${p}`, { method, headers: { apikey: KEY, Authorization: `Bearer ${token ?? KEY}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) }, body: body ? JSON.stringify(body) : undefined })
    .then(async (r) => ({ status: r.status, json: await r.json().catch(() => null) }));
const rpc = (token, p_payment_method, p_upi_id, p_items) => call("rpc/place_order", { token, method: "POST", body: { p_payment_method, p_upi_id, p_items } });
const denied = (r) => [401, 403].includes(r.status) || r.json?.code === "42501";

let failed = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`); if (!ok) failed++; };
const line = (id, price, quantity, name = `Item ${id}`) => ({ jewellery_item_id: id, name, price, quantity });
const addr = { full_name: "Asha Test", phone: "9876543210", address_line1: "1 Main Street", city: "Pune", state: "MH", pincode: "411001" };

const emailA = await ask("User A email: "), passA = await ask("User A password: ", true);
const emailB = await ask("User B email: "), passB = await ask("User B password: ", true);
const A = await signIn(emailA, passA), B = await signIn(emailB, passB);
if (A.id === B.id) { console.error("User A and B must be different users."); process.exit(2); }
const ensureAddr = (u) => call("user_addresses?on_conflict=user_id", { token: u.token, method: "POST", prefer: "resolution=merge-duplicates", body: { user_id: u.id, ...addr } });
await ensureAddr(A);
console.log("\nSigned in both users. Running checks…\n");

// ---- no_address (user B must have no address) ----
const bHas = (await call("user_addresses?select=id", { token: B.token })).json?.length > 0;
let noAddrDone = false;
if (bHas) {
  const a = await ask("To test 'no_address', open Supabase -> Table Editor -> user_addresses and DELETE user B's row, then press Enter (or type skip): ");
  noAddrDone = a.toLowerCase() !== "skip" && (await call("user_addresses?select=id", { token: B.token })).json?.length === 0;
} else noAddrDone = true;
if (noAddrDone) {
  const r = await rpc(B.token, "cod", null, [line(1, 1500, 1)]);
  check("O0 place_order without a saved address -> no_address", r.status === 400 && r.json?.message === "no_address", `${r.status} ${JSON.stringify(r.json)}`);
} else console.log("SKIP  O0 no_address (user B still has an address)");
await ensureAddr(B);

// ---- success paths ----
let r = await rpc(A.token, "cod", null, [line(1, 1500, 2, "Ring"), line(7, 2500, 1, "Chain")]);
const orderA = typeof r.json === "string" ? r.json : null;
check("O1a COD order is created and returns an order id (uuid)", r.status === 200 && /^[0-9a-f-]{36}$/.test(orderA ?? ""), `${r.status} ${JSON.stringify(r.json)}`);
r = await call(`orders?id=eq.${orderA}&select=*,order_items(*)`, { token: A.token });
const o = r.json?.[0];
check("O1b stored order: total computed by the database = 5500, status confirmed, method cod", o && o.subtotal === 5500 && o.total === 5500 && o.status === "confirmed" && o.payment_method === "cod" && o.upi_id === null, JSON.stringify(o)?.slice(0, 200));
check("O1c order has exactly 2 items with the submitted prices/quantities", o?.order_items?.length === 2 && o.order_items.some((i) => i.jewellery_item_id === 1 && i.price === 1500 && i.quantity === 2), JSON.stringify(o?.order_items));
check("O1d address snapshot was copied from the caller's saved address", o?.address_snapshot?.full_name === "Asha Test" && o.address_snapshot.pincode === "411001" && o.address_snapshot.user_id === A.id, JSON.stringify(o?.address_snapshot));
r = await rpc(A.token, "upi", "asha@okbank", [line(3, 900, 1)]);
check("O2a UPI order with a valid UPI id succeeds", r.status === 200 && typeof r.json === "string", `${r.status} ${JSON.stringify(r.json)}`);

// ---- validation: every bad input must be 'invalid_order' (never a cast/other error) ----
const one = [line(1, 100, 1)];
const bad = [
  ["bad UPI id 'not-a-upi'", ["upi", "not-a-upi", one]], ["UPI without id", ["upi", null, one]], ["COD with a UPI id", ["cod", "asha@okbank", one]],
  ["unknown payment method", ["card", null, one]], ["null payment method", [null, null, one]],
  ["empty cart []", ["cod", null, []]], ["items is an object", ["cod", null, {}]], ["items is null", ["cod", null, null]], ["items is a string", ["cod", null, "x"]], ["element is a number", ["cod", null, [1]]], ["element is {}", ["cod", null, [{}]]],
  ["quantity 0", ["cod", null, [line(1, 100, 0)]]], ["quantity 11", ["cod", null, [line(1, 100, 11)]]], ["quantity 1.5", ["cod", null, [line(1, 100, 1.5)]]], ["quantity '2' (string)", ["cod", null, [{ ...line(1, 100, 1), quantity: "2" }]]],
  ["negative price", ["cod", null, [line(1, -5, 1)]]], ["fractional price", ["cod", null, [line(1, 10.5, 1)]]], ["price over 9 digits", ["cod", null, [line(1, 99999999999, 1)]]],
  ["item id 0", ["cod", null, [line(0, 100, 1)]]], ["blank name", ["cod", null, [line(1, 100, 1, "   ")]]], ["missing name", ["cod", null, [{ jewellery_item_id: 1, price: 100, quantity: 1 }]]],
  ["duplicate item ids", ["cod", null, [line(1, 100, 1), line(1, 100, 1)]]], ["41 lines", ["cod", null, Array.from({ length: 41 }, (_, i) => line(i + 1, 100, 1))]],
];
for (const [label, [pm, upi, items]] of bad) {
  r = await rpc(A.token, pm, upi, items);
  check(`O3 rejects ${label} with invalid_order`, r.status === 400 && r.json?.message === "invalid_order", `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
}
r = await rpc(A.token, "cod", null, Array.from({ length: 40 }, (_, i) => line(i + 1, 100, 1)));
check("O3b a 40-line order (the maximum) is accepted", r.status === 200 && typeof r.json === "string", `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);

// ---- access control ----
r = await call("rpc/place_order", { method: "POST", body: { p_payment_method: "cod", p_upi_id: null, p_items: one } });
check("O4 anonymous cannot call place_order", denied(r), `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
for (const t of ["orders", "order_items"]) { r = await call(`${t}?select=id`); check(`O5 anonymous cannot read ${t}`, denied(r), `${r.status}`); }
r = await call("orders?select=id", { token: B.token });
check("O6a user B sees none of user A's orders", r.status === 200 && !r.json.some((x) => x.id === orderA), JSON.stringify(r.json)?.slice(0, 120));
r = await call("order_items?select=id", { token: B.token });
check("O6b user B sees none of user A's order items", r.status === 200 && !r.json.some((x) => x.order_id === orderA), JSON.stringify(r.json)?.slice(0, 120));
r = await call("order_items", { token: B.token, method: "POST", body: { order_id: orderA, jewellery_item_id: 9, name: "Evil", price: 1, quantity: 1 } });
check("O6c user B cannot add an item to user A's order (RLS)", denied(r), `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);

// ---- orders are immutable from the client; no forged status ----
r = await call(`orders?id=eq.${orderA}`, { token: A.token, method: "PATCH", body: { total: 1 } });
check("O7a user cannot UPDATE an order", denied(r), `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
r = await call(`orders?id=eq.${orderA}`, { token: A.token, method: "DELETE" });
check("O7b user cannot DELETE an order", denied(r), `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
r = await call(`order_items?order_id=eq.${orderA}`, { token: A.token, method: "PATCH", body: { price: 1 } });
check("O7c user cannot UPDATE order items", denied(r), `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
r = await call(`order_items?order_id=eq.${orderA}`, { token: A.token, method: "DELETE" });
check("O7d user cannot DELETE order items", denied(r), `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
const direct = (extra) => call("orders", { token: A.token, method: "POST", body: { user_id: A.id, address_snapshot: {}, payment_method: "cod", subtotal: 1, total: 1, ...extra } });
r = await direct({ status: "delivered" });
check("O8a a client-inserted order with status 'delivered' is rejected", r.status >= 400, `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
r = await direct({ payment_method: "upi" });
check("O8b CHECK: 'upi' without a UPI id rejected", r.status === 400 && r.json?.code === "23514", `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
r = await direct({ subtotal: -1 });
check("O8c CHECK: negative subtotal rejected", r.status === 400 && r.json?.code === "23514", `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
r = await direct({ address_snapshot: [] });
check("O8d CHECK: array address snapshot rejected", r.status === 400 && r.json?.code === "23514", `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
r = await call("order_items", { token: A.token, method: "POST", body: { order_id: orderA, jewellery_item_id: 77, name: "Extra", price: 1, quantity: 11 } });
check("O8e CHECK: item quantity 11 rejected", r.status === 400 && r.json?.code === "23514", `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
r = await call("order_items", { token: A.token, method: "POST", body: { order_id: orderA, jewellery_item_id: 1, name: "Dup", price: 1, quantity: 1 } });
check("O8f unique(order_id, item): the same item twice in one order rejected", r.status === 409 && r.json?.code === "23505", `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);

console.log(`\n${failed === 0 ? "ALL CHECKS PASSED" : failed + " CHECK(S) FAILED"}`);
process.exit(failed ? 1 : 0);
