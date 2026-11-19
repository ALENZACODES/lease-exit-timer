// Round 2 checks: Ontario holidays for courier timing, the email consent guard, fixed term entry,
// and the Form N9 checklist shown beside the date.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const L = require(join(root, "site/dates.js"));
const rules = require(join(root, "site/data/rules.json"));

let failed = 0, passed = 0;
function eq(name, a, b) {
  if (a === b) { passed++; return; }
  failed++; console.error("FAIL", name, "got", a, "expected", b);
}
const iso = (d) => L.toISO(d);
const names = (y) => L.holidaysIn(y).map((h) => h.date + " " + h.name);
const has = (y, s) => names(y).includes(s);

// Legislation Act, 2006, s. 88 holidays, computed for any year.
eq("easter 2026", iso(L.easterSunday(2026)), "2026-04-05");
eq("easter 2027", iso(L.easterSunday(2027)), "2027-03-28");
eq("easter 2028", iso(L.easterSunday(2028)), "2028-04-16");
eq("easter 2029", iso(L.easterSunday(2029)), "2029-04-01");
eq("good friday 2026", has(2026, "2026-04-03 Good Friday"), true);
eq("easter monday 2027", has(2027, "2027-03-29 Easter Monday"), true);
eq("family day 2027", has(2027, "2027-02-15 Family Day"), true);
eq("victoria day 2026", has(2026, "2026-05-18 Victoria Day"), true);
eq("victoria day 2027", has(2027, "2027-05-24 Victoria Day"), true);
eq("canada day on sunday moves to july 2 (s. 88 (4))", has(2029, "2029-07-02 Canada Day"), true);
eq("labour day 2026", has(2026, "2026-09-07 Labour Day"), true);
eq("thanksgiving 2026", has(2026, "2026-10-12 Thanksgiving Day"), true);
eq("remembrance day 2026", has(2026, "2026-11-11 Remembrance Day"), true);
eq("christmas on saturday adds monday (s. 88 (5))", has(2027, "2027-12-27 Monday after Christmas Day"), true);
eq("christmas on sunday adds tuesday (s. 88 (5))", has(2022, "2022-12-27 Tuesday after Christmas Day"), true);
eq("new year on sunday adds monday (s. 88 (3))", has(2023, "2023-01-02 Day after New Year's Day"), true);
eq("civic holiday added to be safe", has(2026, "2026-08-03 Civic Holiday"), true);
eq("ordinary tuesday is not a holiday", L.isCourierHoliday(L.parseISO("2026-11-24")), false);
eq("saturday is a holiday under rule 1.1", L.isCourierHoliday(L.parseISO("2026-11-28")), true);

// Courier regressions. The weekend only engine said these counted on a holiday.
const xmas = L.compute({ noticeDate: "2026-12-24", kind: "monthly", dueDay: 1, delivery: "courier" });
eq("courier dec 24 2026 skips christmas, boxing day and sunday", xmas.notice, "2026-12-28");
eq("courier dec 24 2026 lists the skipped days", xmas.courierSkipped.map((h) => h.name).join(","), "Christmas Day,Saturday (Boxing Day),Sunday"); // round 4: a Saturday on the s. 88 list is shown as a weekend day
const ny = L.compute({ noticeDate: "2026-12-31", kind: "monthly", dueDay: 1, delivery: "courier" });
eq("courier dec 31 2026 counts on jan 4 2027", ny.notice, "2027-01-04");
eq("so february 28 is no longer reachable", ny.termination, "2027-03-31");
eq("and the special rule is not used", ny.usedSpecial, false);
const ny30 = L.compute({ noticeDate: "2026-12-30", kind: "monthly", dueDay: 1, delivery: "courier" });
eq("courier dec 30 2026 still reaches february 28", ny30.termination, "2027-02-28");
eq("last courier day for february 28 2027 is dec 30", ny30.lastSendDay, "2026-12-30");
const rem = L.deemedGiven(L.parseISO("2026-11-10"), "courier");
eq("courier nov 10 2026 skips remembrance day", iso(rem), "2026-11-12");
const gf = L.deemedGiven(L.parseISO("2027-03-25"), "courier");
eq("courier before easter 2027 skips good friday to easter monday", iso(gf), "2027-03-30");
const x27 = L.deemedGiven(L.parseISO("2027-12-24"), "courier");
eq("courier dec 24 2027 skips to tuesday dec 28", iso(x27), "2027-12-28");
eq("mail is not moved by holidays (s. 191 (3))", L.compute({ noticeDate: "2026-12-20", kind: "monthly", dueDay: 1, delivery: "mail" }).notice, "2026-12-25");

// Email needs written consent that covers a notice to end the tenancy.
const base = { noticeDate: "2026-12-02", kind: "monthly", dueDay: 1, delivery: "email" };
eq("email with no boxes is refused", typeof L.compute(base).error, "string");
eq("email with consent only is refused", typeof L.compute({ ...base, emailConsent: true }).error, "string");
eq("email with scope only is refused", typeof L.compute({ ...base, emailCoversNotice: true }).error, "string");
eq("refusal names rule 3.5", L.compute(base).error.includes("3.5"), true);
eq("email with both counts the same day", L.compute({ ...base, emailConsent: true, emailCoversNotice: true }).notice, "2026-12-02");

// Fixed term entry and validation.
const ft = L.compute({ noticeDate: "2026-11-19", kind: "fixed", expiryDate: "2027-08-31", dueDay: 1 });
eq("one year lease valid", ft.valid, true);
eq("ends on expiry", ft.termination, "2027-08-31");
eq("last notice day is 60 days before", ft.lastNoticeDay, "2027-07-02");
eq("matching rent day has no note", ft.notes.length, 0);
const odd = L.compute({ noticeDate: "2026-11-19", kind: "fixed", expiryDate: "2027-08-15", dueDay: 1 });
eq("end date off the rent cycle gets a note", odd.notes.length, 1);
eq("missing end date is refused", L.compute({ noticeDate: "2026-11-19", kind: "fixed", expiryDate: "" }).field, "expiry");
eq("missing end date explains it", L.compute({ noticeDate: "2026-11-19", kind: "fixed", expiryDate: "" }).error.includes("end date written in your lease"), true);
eq("impossible end date is refused", L.compute({ noticeDate: "2026-11-19", kind: "fixed", expiryDate: "2027-02-30" }).field, "expiry");
eq("end date over ten years out is refused", L.compute({ noticeDate: "2026-11-19", kind: "fixed", expiryDate: "2037-08-31" }).field, "expiry");
eq("end date before notice counts is refused", L.compute({ noticeDate: "2026-11-19", kind: "fixed", expiryDate: "2026-11-19" }).field, "expiry");
const ftMail = L.compute({ noticeDate: "2027-07-01", kind: "fixed", expiryDate: "2027-08-31", dueDay: 1, delivery: "mail" });
eq("fixed term by mail counts delivery", ftMail.valid, false);

// Form N9 checklist beside the date.
const hand = L.compute({ noticeDate: "2026-11-28", kind: "monthly", dueDay: 1, delivery: "hand" });
const list = L.n9Checklist(hand);
eq("checklist has the form fields", list.length, 8);
eq("checklist shows termination date as on the form", list.find((x) => x.field.startsWith("The last day of my tenancy")).fill, "31/01/2027");
eq("checklist asks for all tenant names", list.some((x) => x.fill === "Include all tenant names"), true);
eq("checklist ends with the give by day", list[list.length - 1].fill.startsWith("02/12/2026"), true);
eq("no checklist when invalid", L.n9Checklist(L.compute({ noticeDate: "2026-11-19", kind: "fixed", expiryDate: "2026-12-31", dueDay: 1 })).length, 0);

// Sources.
eq("rules cite rule 1.1", rules.sources.some((s) => s.name.includes("1.1")), true);
eq("rules cite s. 88", rules.sources.some((s) => s.name.includes("88")), true);
eq("rules cite the email consent form", rules.sources.some((s) => s.url.includes("Email%20Service%20Consent")), true);
eq("rules cite s. 47", rules.sources[0].name.includes("47"), true);

if (failed) { console.error(failed + " failed, " + passed + " passed"); process.exit(1); }
console.log("round 2 tests: " + passed + " passed");
