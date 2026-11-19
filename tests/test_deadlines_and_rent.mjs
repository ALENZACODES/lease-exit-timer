// Holiday extension of the s. 44 (5) deadlines (Legislation Act, 2006, s. 89 (1)), with LTB rule 1.14 only
// mentioned; Board weekday closures labelled UNKNOWN; the decision sentence and the Why this date section;
// and the late rent estimate for weekly, daily and monthly tenancies.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const L = require(join(root, "site/dates.js"));
const rules = require(join(root, "site/data/rules.json"));
const app = readFileSync(join(root, "site/app.js"), "utf8");

let failed = 0, passed = 0;
function eq(name, a, b) {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { passed++; return; }
  failed++; console.error("FAIL", name, "got", A, "expected", B);
}
const D = (iso) => L.parseISO(iso);
const iso = (d) => L.toISO(d);
const M = (date, extra) => L.compute(Object.assign({ noticeDate: date, kind: "monthly", dueDay: 1, delivery: "hand" }, extra || {}));

// Legislation Act holidays: Sunday and the s. 88 days, never Saturday, never the Civic Holiday.
eq("sunday is a legislation holiday", L.isLegislationHoliday(D("2027-01-03")), true);
eq("saturday is not", L.isLegislationHoliday(D("2027-01-02")), false);
eq("new year's day is", L.isLegislationHoliday(D("2027-01-01")), true);
eq("civic holiday 2027 is not", L.isLegislationHoliday(D("2027-08-02")), false);

// s. 89 (1) extension of the January 1 deadline.
eq("2027: jan 1 friday extends to saturday jan 2", iso(L.s89Extend(D("2027-01-01"))), "2027-01-02");
eq("2028: jan 1 saturday is still a holiday, extends past sunday to monday jan 3", iso(L.s89Extend(D("2028-01-01"))), "2028-01-03");
eq("2029: jan 1 monday extends to tuesday jan 2", iso(L.s89Extend(D("2029-01-01"))), "2029-01-02");
eq("2034: jan 1 sunday, s. 88 (3) monday jan 2, extends to tuesday jan 3", iso(L.s89Extend(D("2034-01-01"))), "2034-01-03");
eq("2026: feb 1 sunday extends to monday feb 2", iso(L.s89Extend(D("2026-02-01"))), "2026-02-02");
eq("2027: feb 1 monday is not extended", iso(L.s89Extend(D("2027-02-01"))), "2027-02-01");
eq("rule 1.14 for jan 1 2027 reaches monday jan 4", iso(L.rule114Extend(D("2027-01-01"))), "2027-01-04");

// Notice on the extended day still reaches the end of February or March.
eq("hand jan 2 2027 ends feb 28", [M("2027-01-02").termination, M("2027-01-02").usedSpecial], ["2027-02-28", true]);
eq("hand jan 3 2027 does not", M("2027-01-03").termination, "2027-03-31");
eq("hand jan 4 2027 (rule 1.14 day) is not relied on", M("2027-01-04").termination, "2027-03-31");
eq("hand jan 3 2028 ends feb 29 2028", M("2028-01-03").termination, "2028-02-29");
eq("hand jan 4 2028 does not", M("2028-01-04").termination, "2028-03-31");
eq("hand jan 3 2034 ends feb 28 2034", M("2034-01-03").termination, "2034-02-28");
eq("hand feb 2 2026 ends mar 31 2026", M("2026-02-02").termination, "2026-03-31");
eq("hand feb 3 2026 does not", M("2026-02-03").termination, "2026-04-30");
eq("hand feb 2 2027 does not reach march (no extension in 2027)", M("2027-02-02").termination, "2027-04-30");

const x = M("2027-01-02").deadlineExtended;
eq("extension object", x, { deadline: "2027-01-01", extendedTo: "2027-01-02", rule114: "2027-01-04", usedByThisNotice: true });
eq("last notice day is the extended day", M("2027-01-02").lastNoticeDay, "2027-01-02");
eq("mail nov 28 2026: last mail day dec 28", M("2026-11-28", { delivery: "mail" }).lastSendDay, "2026-12-28");
eq("mail dec 29 2026 misses february", M("2026-12-29", { delivery: "mail" }).termination, "2027-03-31");
eq("no extension object for an ordinary january end", M("2026-11-19").deadlineExtended, undefined);

// Minimum periods are not extended: 60 days from Dec 2, 2026 still ends Jan 31, Dec 3 does not.
eq("60 day minimum not extended", [M("2026-12-02").termination, M("2026-12-03").termination], ["2027-01-31", "2027-02-28"]);

// UI text: the extension note, the rule 1.14 limit, UNKNOWN closure labels, decision sentence, Why this date.
eq("app explains s. 89 (1)", app.includes("s. 89 (1) extends a time limit"), true);
eq("app says it does not rely on rule 1.14", app.includes("This page does not rely on that later day"), true);
eq("app says minimum periods are not extended", app.includes("minimum periods are not extended"), true);
eq("closures labelled UNKNOWN", (app.match(/UNKNOWN, counted as closed/g) || []).length, 2);
eq("weekends labelled VERIFIED", app.includes("VERIFIED: Saturday or Sunday"), true);
eq("decision sentence", app.includes('id="decision"'), true);
eq("why this date", app.includes("<summary>Why this date</summary>"), true);
eq("rules.json labels closures unknown", JSON.stringify(rules).includes("UNKNOWN"), true);

// Late rent estimate: one period of the tenancy's own unit, never a month for weekly or daily.
const wk = L.compute({ noticeDate: "2026-11-19", kind: "weekly", payWeekday: "1", delivery: "hand", rent: "400" });
eq("weekly late cost is one week", [wk.lateCost.periods, wk.lateCost.unit, wk.lateCost.amount], [1, "week", 400]);
eq("weekly late end is 7 days later", [wk.termination, wk.lateCost.termination], ["2026-12-20", "2026-12-27"]);
const dy = L.compute({ noticeDate: "2026-11-19", kind: "daily", delivery: "hand", rent: "60" });
eq("daily late cost is one day", [dy.lateCost.periods, dy.lateCost.unit, dy.lateCost.amount], [1, "day", 60]);
eq("daily late end is 1 day later", [dy.termination, dy.lateCost.termination], ["2026-12-17", "2026-12-18"]);
const wm = L.compute({ noticeDate: "2026-11-28", kind: "weekly", payWeekday: "1", delivery: "mail", rent: "425.50" });
eq("weekly by mail costs one week", [wm.lateCost.periods, wm.lateCost.unit, wm.lateCost.amount], [1, "week", 425.5]);
const mo = M("2026-11-19", { rent: "1850" });
eq("monthly late cost is one month", [mo.lateCost.periods, mo.lateCost.unit, mo.lateCost.amount], [1, "month", 1850]);
const fx = L.compute({ noticeDate: "2026-11-19", kind: "fixed", dueDay: 1, expiryDate: "2027-03-31", delivery: "hand", rent: "1850" });
eq("fixed term late cost via monthly fallback", [fx.lateCost.viaFallback, fx.lateCost.termination], [true, "2027-04-30"]);
eq("late note cites s. 16 duty to minimize losses", app.includes("s. 16 of the Act"), true);
eq("late note names the unit, not always a month", app.includes("rent per week") && app.includes("rent per day"), true);

if (failed) { console.error(failed + " failed"); process.exit(1); }
console.log("deadline, closure and rent tests: " + passed + " passed");
