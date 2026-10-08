// Epic 10, Story 10.1 — API-level verification of migration 0002 (public.user_addresses) against the
// DEVELOPMENT Supabase project (the one in aura/.env.local). Run it in YOUR terminal so test-user
// passwords never enter a chat:
//
//     node docs/data/verify/api-check-0002-user-addresses.mjs
//
// It asks for the two dev test users' email + password (typing is hidden), signs them in through the
// public Auth API, and exercises user_addresses through the same REST API the app uses (anon key +
// user JWT, RLS applies). It prints PASS/FAIL per check and never prints keys, tokens or passwords.
// Side effects: it leaves ONE test address row for each test user (upserted; there is no client
// DELETE policy by design). Safe to re-run.
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(here, "../../../aura/.env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
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
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const b = await r.json();
  if (!r.ok || !b.access_token) throw new Error(`sign-in failed for ${email}: ${b.error_description || b.msg || r.status}`);
  return { token: b.access_token, id: b.user.id };
}
const rest = (p, { token, method = "GET", body, prefer } = {}) =>
  fetch(`${URL_}/rest/v1/${p}`, {
    method,
    headers: { apikey: KEY, Authorization: `Bearer ${token ?? KEY}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => null) }));

let failed = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`); if (!ok) failed++; };
const good = { full_name: "Asha Test", phone: "9876543210", address_line1: "1 Main Street", city: "Pune", state: "MH", pincode: "411001" };

const emailA = await ask("User A email: "), passA = await ask("User A password: ", true);
const emailB = await ask("User B email: "), passB = await ask("User B password: ", true);
const A = await signIn(emailA, passA), B = await signIn(emailB, passB);
if (A.id === B.id) { console.error("User A and B must be different users."); process.exit(2); }
console.log("\nSigned in both users. Running checks…\n");

// T1 own insert/upsert + select
let r = await rest("user_addresses?on_conflict=user_id", { token: A.token, method: "POST", prefer: "resolution=merge-duplicates,return=representation", body: { user_id: A.id, ...good } });
check("T1a user A can upsert their own address", [200, 201].includes(r.status) && r.json?.[0]?.user_id === A.id, `${r.status} ${JSON.stringify(r.json)}`);
r = await rest("user_addresses?select=*", { token: A.token });
check("T1b user A sees exactly their own row", r.status === 200 && r.json.length === 1 && r.json[0].user_id === A.id, `${r.status} rows=${r.json?.length}`);

// T2 isolation
r = await rest("user_addresses?select=*", { token: B.token });
check("T2a user B does not see user A's address", r.status === 200 && !r.json.some((x) => x.user_id === A.id), `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
r = await rest("user_addresses", { token: B.token, method: "POST", body: { user_id: A.id, ...good } });
check("T2b user B cannot insert a row for user A (RLS)", r.status >= 400 && ["42501"].includes(r.json?.code), `${r.status} ${JSON.stringify(r.json)}`);

// T3 cross-user update + unique
r = await rest(`user_addresses?user_id=eq.${A.id}`, { token: B.token, method: "PATCH", prefer: "return=representation", body: { city: "Hacked" } });
check("T3a user B cannot update user A's row (0 rows affected)", (r.status === 200 && r.json.length === 0) || r.status === 204, `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
r = await rest("user_addresses?select=city", { token: A.token });
check("T3b user A's city is unchanged", r.json?.[0]?.city === "Pune", JSON.stringify(r.json));
await rest("user_addresses?on_conflict=user_id", { token: B.token, method: "POST", prefer: "resolution=merge-duplicates", body: { user_id: B.id, ...good } });
r = await rest("user_addresses", { token: B.token, method: "POST", body: { user_id: B.id, ...good } });
check("T3c a second address for the same user is rejected (unique user_id)", r.status === 409 && r.json?.code === "23505", `${r.status} ${JSON.stringify(r.json)}`);
r = await rest(`user_addresses?user_id=eq.${B.id}`, { token: B.token, method: "PATCH", prefer: "return=representation", body: { user_id: A.id } });
check("T3d user B cannot re-assign their row to user A (update with-check)", r.status >= 400 || (r.status === 200 && r.json.length === 0), `${r.status} ${JSON.stringify(r.json)}`);

// T4 CHECK constraints (as A, updating own row)
const bad = [["phone 3 digits", { phone: "123" }], ["phone with letters", { phone: "98765abcde" }], ["pincode 5 digits", { pincode: "41100" }], ["pincode 7 digits", { pincode: "4110011" }], ["blank full_name", { full_name: "   " }], ["blank city", { city: "" }], ["address_line1 over 200 chars", { address_line1: "x".repeat(201) }]];
for (const [label, patch] of bad) {
  r = await rest(`user_addresses?user_id=eq.${A.id}`, { token: A.token, method: "PATCH", body: patch });
  check(`T4 rejects ${label} (CHECK constraint)`, r.status === 400 && r.json?.code === "23514", `${r.status} ${JSON.stringify(r.json)}`);
}

// T5 anon denied
r = await rest("user_addresses?select=*");
check("T5a anonymous (not logged in) cannot read the table", r.status === 401 || r.status === 403 || r.json?.code === "42501", `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);
r = await rest("user_addresses", { method: "POST", body: { user_id: A.id, ...good } });
check("T5b anonymous cannot insert", r.status === 401 || r.status === 403 || r.json?.code === "42501", `${r.status} ${JSON.stringify(r.json)?.slice(0, 120)}`);

// T6 no client DELETE
r = await rest(`user_addresses?user_id=eq.${A.id}`, { token: A.token, method: "DELETE", prefer: "return=representation" });
check("T6 user cannot delete their address from the client (no delete policy)", (r.status === 200 && r.json.length === 0) || r.status === 204 || r.status >= 400, `${r.status} ${JSON.stringify(r.json)}`);
r = await rest("user_addresses?select=id", { token: A.token });
check("T6b the row still exists after the delete attempt", r.json?.length === 1, JSON.stringify(r.json));

console.log(`\n${failed === 0 ? "ALL CHECKS PASSED" : failed + " CHECK(S) FAILED"}`);
process.exit(failed ? 1 : 0);
