import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const L = require(join(root, "site/dates.js"));
const rules = require(join(root, "site/data/rules.json"));

let failed = 0;
function eq(name, a, b) {
  const ok = Object.is(a, b) || a === b;
  if (!ok) {
    failed += 1;
    console.error("FAIL", name, "got", a, "expected", b);
  } else {
    console.log("ok", name);
  }
}

// Nov 9, 2026 monthly, rent due on the 1st: 60 days is Jan 8, 2027, so period end Jan 31.
const a = L.compute({ noticeDate: "2026-11-09", kind: "monthly", dueDay: 1 });
eq("nov9 monthly term", a.termination, "2027-01-31");
eq("nov9 last notice for that term", a.lastNoticeDay, "2026-12-02");
eq("nov9 valid", a.valid, true);
eq("nov9 not special", a.usedSpecial, false);

// Jan 1, 2027 can use Feb 28, 2027 under the special rule (2027 is not a leap year).
const b = L.compute({ noticeDate: "2027-01-01", kind: "monthly", dueDay: 1 });
eq("jan1 term", b.termination, "2027-02-28");
eq("jan1 special", b.usedSpecial, true);
eq("jan1 last notice", b.lastNoticeDay, "2027-01-01");

// Jan 2 is too late for February, so March 31 (Jan 2 + 60 = Mar 3, period end Mar 31).
// Wait: special rule for March allows notice no later than Feb 1, so Jan 2 CAN use March 31
// even without 60 days... March 31 from Jan 2 is more than 60 days actually.
// Jan 2 + 60 = March 3, period end March 31 is the ordinary path, not needing special.
// Is there an earlier period end? Feb 28 is not allowed on Jan 2. So March 31 ordinary.
const c = L.compute({ noticeDate: "2027-01-02", kind: "monthly", dueDay: 1 });
eq("jan2 term", c.termination, "2027-03-31");
eq("jan2 special?", c.usedSpecial, false);

// Feb 1, 2027 can use March 31 under special rule, which is earlier than Feb 1+60=Apr 2 / Apr 30.
const d = L.compute({ noticeDate: "2027-02-01", kind: "monthly", dueDay: 1 });
eq("feb1 term", d.termination, "2027-03-31");
eq("feb1 special", d.usedSpecial, true);
eq("feb1 last notice", d.lastNoticeDay, "2027-02-01");

// Feb 2 cannot use March 31 (60 days: Feb 2+60=Apr 3, period end Apr 30).
const e = L.compute({ noticeDate: "2027-02-02", kind: "monthly", dueDay: 1 });
eq("feb2 term", e.termination, "2027-04-30");
eq("feb2 not special", e.usedSpecial, false);

// Leap year 2028: Jan 1 can use Feb 29.
const leap = L.compute({ noticeDate: "2028-01-01", kind: "monthly", dueDay: 1 });
eq("leap term", leap.termination, "2028-02-29");
eq("leap special", leap.usedSpecial, true);

// Fixed term ending 2027-06-30, notice 2026-11-09 is early enough. Last notice May 1, 2027.
const f = L.compute({ noticeDate: "2026-11-09", kind: "fixed", expiryDate: "2027-06-30" });
eq("fixed ok", f.valid, true);
eq("fixed term", f.termination, "2027-06-30");
eq("fixed last notice", f.lastNoticeDay, "2027-05-01");

// Fixed term ending 2026-12-15, notice 2026-11-09 is too late (Nov 9+60=Jan 8).
const g = L.compute({ noticeDate: "2026-11-09", kind: "fixed", expiryDate: "2026-12-15" });
eq("fixed late", g.valid, false);

// Weekly: pay Monday, notice Nov 9, +28 = Dec 7 2026 (Monday). Period end is Sunday, so Dec 13.
const w = L.compute({ noticeDate: "2026-11-09", kind: "weekly", payWeekday: 1 });
eq("weekly term", w.termination, "2026-12-13");
eq("weekly weekday", w.periodEndWeekday, 0);

// Daily: +28
const day = L.compute({ noticeDate: "2026-11-09", kind: "daily" });
eq("daily term", day.termination, "2026-12-07");

// Rent due on the 15th: period ends on the 14th. Nov 9 + 60 = Jan 8, next period end Jan 14.
const mid = L.compute({ noticeDate: "2026-11-09", kind: "monthly", dueDay: 15 });
eq("due 15 term", mid.termination, "2027-01-14");

// Rules file has sources and 60/28
eq("monthly days", rules.ordinary_rules.find((r) => r.id === "monthly").min_days, 60);
eq("weekly days", rules.ordinary_rules.find((r) => r.id === "weekly").min_days, 28);
eq("has n9 url", rules.sources.some((s) => s.url.includes("N9.pdf")), true);

if (failed) {
  console.error(failed, "failed");
  process.exit(1);
}
console.log("all date tests passed");
