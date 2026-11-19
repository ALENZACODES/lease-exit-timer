// Round 4 checks: weekday holidays are assumed Board office closures under LTB rule 1.1, the s. 88 weekend
// rules for New Year's Day 2028 and Canada Day 2029, the same end date by every method, the softer late
// cost line, the rental period note, and the limits on rule 1.14 and s. 89 (1).
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const L = require(join(root, "site/dates.js"));
const rules = require(join(root, "site/data/rules.json"));
const app = readFileSync(join(root, "site/app.js"), "utf8");
const page = readFileSync(join(root, "site/index.html"), "utf8");

let failed = 0, passed = 0;
function eq(name, a, b) {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { passed++; return; }
  failed++; console.error("FAIL", name, "got", A, "expected", B);
}
const D = (iso) => L.parseISO(iso);
const dates = (y) => L.holidaysIn(y).map((h) => h.date);
const C = (date, extra) => L.compute(Object.assign({ noticeDate: date, kind: "monthly", dueDay: 1, delivery: "courier" }, extra || {}));

// New Year's Day 2028 is a Saturday. s. 88 (3) adds a Monday only when it falls on a Sunday.
eq("jan 1 2028 is a saturday", L.weekday(D("2028-01-01")), 6);
eq("jan 1 2028 is on the list", dates(2028).includes("2028-01-01"), true);
eq("no extra monday jan 3 2028", dates(2028).includes("2028-01-03"), false);
eq("no extra jan 2 2028", dates(2028).includes("2028-01-02"), false);
eq("courier dec 31 2027 counts monday jan 3 2028", L.deemedGiven(D("2027-12-31"), "courier").d, 3);
eq("skipped are the weekend only", C("2027-12-31").courierSkipped.map((h) => h.kind), ["weekend", "weekend"]);
eq("jan 1 2028 skipped as a weekend day", C("2027-12-31").courierSkipped[0].name, "Saturday (New Year's Day)");
eq("no office open note when only weekends are skipped", C("2027-12-31").officeOpen, undefined);
// New Year's Day 2023 was a Sunday: the Monday is added, as a check on the other side.
eq("jan 2 2023 added by s. 88 (3)", dates(2023).includes("2023-01-02"), true);

// Canada Day 2029: July 1 is a Sunday, so Canada Day is July 2 under s. 88 (4). Nothing is added on July 3.
eq("jul 1 2029 is a sunday", L.weekday(D("2029-07-01")), 0);
eq("canada day 2029 is july 2", L.holidaysIn(2029).find((h) => h.name === "Canada Day").date, "2029-07-02");
eq("canada day 2029 source is s. 88 (4)", L.holidaysIn(2029).find((h) => h.name === "Canada Day").source, "Legislation Act, 2006, s. 88 (4)");
eq("july 1 2029 is not on the list", dates(2029).includes("2029-07-01"), false);
eq("july 3 2029 is not on the list", dates(2029).includes("2029-07-03"), false);
eq("courier jun 29 2029 counts jul 3", L.toISO(L.deemedGiven(D("2029-06-29"), "courier")), "2029-07-03");
eq("courier jun 29 2029 skips sat, sun, canada day", C("2029-06-29").courierSkipped.map((h) => h.date + " " + h.kind), ["2029-06-30 weekend", "2029-07-01 weekend", "2029-07-02 statutory"]);
eq("canada day 2029 office open note", [C("2029-06-29").officeOpen.notice, C("2029-06-29").officeOpen.days], ["2029-07-02", ["Canada Day"]]);
// Christmas Day 2027 is a Saturday: Monday December 27 is added by s. 88 (5). Christmas 2022 was a Sunday: Tuesday the 27th.
eq("dec 27 2027 added", L.holidaysIn(2027).find((h) => h.date === "2027-12-27").source, "Legislation Act, 2006, s. 88 (5)");
eq("dec 27 2022 added", dates(2022).includes("2022-12-27"), true);

// Rule 1.1 turns on office closures. Weekends only, if the offices were open every weekday.
eq("weekends only option", L.isCourierHoliday(D("2027-01-01"), { closures: false }), false);
eq("weekends still holidays with closures off", L.isCourierHoliday(D("2027-01-02"), { closures: false }), true);
const ny = C("2026-12-31");
eq("new year 2027 courier: offices open would allow feb 28", [ny.termination, ny.officeOpen.notice, ny.officeOpen.termination, ny.officeOpen.changesEnd], ["2027-03-31", "2027-01-01", "2027-02-28", true]);
const civic = C("2027-07-30", { dueDay: 2 });
eq("civic case office open note", [civic.termination, civic.officeOpen.termination, civic.officeOpen.days], ["2027-11-01", "2027-10-01", ["Civic Holiday"]]);
eq("hand delivery has no office open note", L.compute({ noticeDate: "2026-12-31", kind: "monthly", dueDay: 1, delivery: "hand" }).officeOpen, undefined);
eq("weekendsOnly result skips weekends only", L.compute({ noticeDate: "2026-12-31", kind: "monthly", dueDay: 1, delivery: "courier", weekendsOnly: true }).notice, "2027-01-01");

// The same end date by every method.
const ord = L.compute({ noticeDate: "2026-11-19", kind: "monthly", dueDay: 1, delivery: "hand" });
eq("by method for jan 31 2027", ord.byMethod, [
  { method: "hand", lastSendDay: "2026-12-02" }, { method: "mail", lastSendDay: "2026-11-27" },
  { method: "courier", lastSendDay: "2026-12-01" }, { method: "email", lastSendDay: "2026-12-02" }]);
eq("by method matches own method", ord.byMethod.find((x) => x.method === ord.delivery).lastSendDay, ord.lastSendDay);
eq("by method for march 31 2027 courier", ny.byMethod.map((x) => x.lastSendDay), ["2027-02-01", "2027-01-27", "2027-01-31", "2027-02-01"]);
let same = true;
for (const m of ["hand", "mail", "courier"]) {
  for (const day of ["2026-11-19", "2026-12-20", "2027-06-15", "2027-12-24"]) {
    const r = L.compute({ noticeDate: day, kind: "monthly", dueDay: 1, delivery: m });
    for (const x of r.byMethod) {
      if (x.method === "email") continue;
      const back = L.compute({ noticeDate: x.lastSendDay, kind: "monthly", dueDay: 1, delivery: x.method });
      if (back.termination !== r.termination) same = false;
      const late = L.compute({ noticeDate: L.toISO(L.addDays(D(x.lastSendDay), 1)), kind: "monthly", dueDay: 1, delivery: x.method });
      if (late.termination === r.termination) same = false;
    }
  }
}
eq("each by method day reaches the same end date and the next day does not", same, true);
eq("page renders by method line", app.includes('id="by-method"') && app.includes("Same end date, every method."), true);

// The late cost line is an estimate, not a bill.
eq("late line says could mean", app.includes("One day late could mean about "), true);
eq("late line says estimate", app.includes("This is an estimate from the rent you typed, not a bill."), true);
eq("old categorical wording gone", app.includes("One day late costs about"), false);
eq("mail and ordinary examples use the same rent", (app.match(/rent: "1850"/g) || []).length, 2);

// Rental period note beside the rent day box.
eq("period check note", page.includes('id="period-check"') && page.includes("The rental period is set by your tenancy agreement"), true);
eq("due box described by the note", page.includes('aria-describedby="due-hint period-check"'), true);

// Wording and limits.
eq("courier hint mentions assumed closures", page.includes("weekdays the Board's offices are assumed to be closed"), true);
eq("holiday kinds state the s. 88 weekend rules exactly", rules.holiday_kinds.statutory.includes("the Monday after a New Year's Day that falls on a Sunday") && rules.holiday_kinds.statutory.includes("Canada Day moves to July 2 when July 1 is a Sunday"), true);
eq("limits name rule 1.14 and s. 89 (1)", rules.limits.some((t) => t.includes("rule 1.14") && t.includes("s. 89 (1)") && t.includes("s. 193")), true);
eq("limits name rule 3.6", rules.limits.some((t) => t.includes("3.6")), true);

console.log(failed ? failed + " failed" : "round 4 tests: " + passed + " passed");
if (failed) process.exit(1);
