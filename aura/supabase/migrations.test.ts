import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Epic 10, Story 10.2. Static guard over the SQL migrations. Postgres compiles a regular
// expression only when it is evaluated, so SQL that merely *parses* can still fail at run time.
// Found by the 10.2 API check on the development database: `{2,256}` in the UPI pattern raised
// "invalid regular expression: invalid repetition count(s)" because Postgres allows at most 255.

const dir = path.resolve(__dirname, "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const PG_REGEX_MAX_REPETITION = 255;

describe("SQL migrations", () => {
  it("finds the migration files", () => {
    expect(files).toContain("0001_favorites.sql");
    expect(files.length).toBeGreaterThanOrEqual(3);
  });

  it.each(files)("%s has no regex repetition count above Postgres' limit (255)", (file) => {
    const sql = readFileSync(path.join(dir, file), "utf8");
    const offenders: string[] = [];
    for (const m of sql.matchAll(/\{(\d+)(?:,(\d*))?\}/g)) {
      for (const n of [m[1], m[2]]) {
        if (n && Number(n) > PG_REGEX_MAX_REPETITION) offenders.push(m[0]);
      }
    }
    expect(offenders).toEqual([]);
  });

  it.each(files.filter((f) => !f.includes("rollback")))("%s: every create-policy statement is for a table with RLS enabled in the same file or earlier", (file) => {
    const sql = readFileSync(path.join(dir, file), "utf8");
    const policyTables = [...sql.matchAll(/create policy[\s\S]*?\bon\s+(public\.\w+)/gi)].map((m) => m[1]);
    for (const table of new Set(policyTables)) {
      expect(sql).toMatch(new RegExp(`alter table ${table.replace(".", "\\.")} enable row level security`, "i"));
    }
  });
});
