// Round 10: the Legislation Act, 2006, s. 88 holiday list, read again on 20 November 2026 from the current
// e-Laws consolidation (currency date November 17, 2026), rebuilt here from the statute text with its own date
// maths and compared with the engine for 2022 to 2040; the conditional fallback and the receipt wording for
// mail; rules 1.14 and 1.15 treated the same way; and a replay of the first brute force run against the
// first engine (commit e67f515, kept byte for byte in tests/fixtures/dates-e67f515.js) to show where the
// 1,650 failures came from.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const L = require(join(root, "site/dates.js"));
const app = readFileSync(join(root, "site/app.js"), "utf8");
const rules = JSON.parse(readFileSync(join(root, "site/data/rules.json"), "utf8"));

let failed = 0, passed = 0;
function eq(name, a, b) {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { passed++; return; }
  failed++; console.error("FAIL", name, "got", A, "expected", B);
}

// 1. s. 88 from the statute text. Own date maths: JavaScript Date in UTC, Easter by the Meeus/Jones/Butcher method.
const iso = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
const dow = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();
const nth = (y, m, wd, n) => { let c = 0; for (let d = 1; d <= 31; d++) if (dow(y, m, d) === wd && ++c === n) return iso(y, m, d); };
const mondayBefore25May = (y) => { for (let d = 24; d >= 18; d--) if (dow(y, 5, d) === 1) return iso(y, 5, d); };
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(y, month - 1, day);
}
const shift = (ms, n) => new Date(ms + n * 86400000).toISOString().slice(0, 10);
function s88(y) {
  const out = new Set([
    iso(y, 1, 1),                 // 2. New Year's Day
    nth(y, 2, 1, 3),              // 2.1 Family Day, third Monday in February
    shift(easter(y), -2),         // 3. Good Friday
    shift(easter(y), 1),          // 4. Easter Monday
    mondayBefore25May(y),         // 5. Victoria Day
    dow(y, 7, 1) === 0 ? iso(y, 7, 2) : iso(y, 7, 1), // 6. Canada Day, and s. 88 (4)
    nth(y, 9, 1, 1),              // 7. Labour Day
    nth(y, 10, 1, 2),             // 8. Thanksgiving Day
    iso(y, 11, 11),               // 9. Remembrance Day
    iso(y, 12, 25),               // 10. Christmas Day
    iso(y, 12, 26)                // 11. Boxing Day
  ]);
  if (dow(y, 1, 1) === 0) out.add(iso(y, 1, 2));    // s. 88 (3)
  if (dow(y, 12, 25) === 6) out.add(iso(y, 12, 27)); // s. 88 (5), Christmas on a Saturday: the following Monday
  if (dow(y, 12, 25) === 0) out.add(iso(y, 12, 27)); // s. 88 (5), Christmas on a Sunday: the following Tuesday
  return [...out].sort();
}
for (let y = 2022; y <= 2040; y++) {
  const engine = L.holidaysIn(y).filter((h) => h.kind === "statutory").map((h) => h.date).sort();
  eq("s. 88 weekday holidays " + y, engine, s88(y));
}
const h26 = L.holidaysIn(2026);
eq("Civic Holiday 2026 is not a s. 88 holiday", h26.find((h) => h.name === "Civic Holiday").kind, "assumed");
eq("Remembrance Day 2026 is a s. 88 holiday", h26.find((h) => h.date === "2026-11-11").kind, "statutory");
eq("Boxing Day 2026 is a s. 88 holiday", h26.find((h) => h.date === "2026-12-26").kind, "statutory");
eq("December 28, 2026 is not a s. 88 holiday (Christmas 2026 is a Friday)", L.isLegislationHoliday(L.parseISO("2026-12-28")), false);
eq("December 28, 2026 is still counted as a possible Board closure", h26.find((h) => h.date === "2026-12-28").kind, "assumed");
eq("December 27, 2027 is a s. 88 (5) holiday (Christmas 2027 is a Saturday)", L.isLegislationHoliday(L.parseISO("2027-12-27")), true);
eq("December 27, 2022 is a s. 88 (5) holiday (Christmas 2022 is a Sunday)", L.isLegislationHoliday(L.parseISO("2022-12-27")), true);
eq("January 2, 2023 is a s. 88 (3) holiday", L.isLegislationHoliday(L.parseISO("2023-01-02")), true);
eq("Saturday is not a s. 88 holiday", L.isLegislationHoliday(L.parseISO("2026-11-28")), false);
const leg = rules.sources.find((x) => x.name.startsWith("Legislation Act"));
eq("rules.json records the s. 88 reading of 20 November 2026", leg.note.includes("Section 88 was read again on 2026-11-20") && leg.note.includes("Civic Holiday is not on the list"), true);

// 2. Mail: the receipt is evidence, not the legal date; the fallbacks are conditional.
const m = L.compute({ noticeDate: "2026-11-28", kind: "monthly", dueDay: 1, delivery: "mail" });
eq("mail: receipt and legal date kept apart", m.sendDayNote.includes("the law counts the notice as given on the fifth day after the day you actually mail it (s. 191 (3)), and the receipt only helps you show which day that was."), true);
eq("mail: hand delivery offered only if it can be done", m.sendDayNote.includes("but only if you can hand it to the landlord or an employee of the landlord with authority for the building, or leave it in the landlord's mail box"), true);
eq("mail: holiday office closure named", m.sendDayNote.includes("an office may be closed on a holiday"), true);
eq("mail: email only with consent", m.sendDayNote.includes("or email, only if the landlord's written consent covers this notice."), true);
eq("mail: no unconditional hand fallback left", m.sendDayNote.includes("check the last day to give it by hand in the line that lists every method, or use"), false);

// 3. Rules 1.14 and 1.15 are treated the same way: named, not relied on.
eq("page: January 1 by hand rests on s. 44 (5) and s. 191 (1)", app.includes("needs no extension and no Board rule"), true);
eq("page: rule 1.15 only as agreeing", app.includes("If they do apply, LTB rule 1.15 agrees"), true);
eq("page: no sentence relies on rule 1.15 alone", app.includes("So giving notice by hand on"), false);
eq("page: s. 47 quoted", app.includes("a contrary intention appears"), true);
eq("page: the email time of day claim is limited to service under rule 3.9", app.includes("This is about service under rule 3.9 only, not every kind of electronic filing."), true);

// 4. Replay of the first brute force run: the checks added in commit 4afd90f, hand delivery only, against the first engine.
const F = require(join(root, "tests/fixtures/dates-e67f515.js"));
const MS = 86400000, utc = (d) => Date.UTC(d.y, d.m - 1, d.d), between = (a, b) => Math.round((utc(b) - utc(a)) / MS);
const periodEnd = (dt, kind, due, pay) => kind === "weekly" ? F.weekday(dt) === (pay + 6) % 7 : F.addDays(dt, 1).d === Math.min(due, F.daysInMonth(F.addDays(dt, 1).y, F.addDays(dt, 1).m));
function legal(n, dt, kind) {
  if (between(n, dt) >= (kind === "weekly" ? 28 : 60)) return true;
  if (kind === "monthly" && F.isLastDayOfFebruary(dt)) return F.cmp(n, F.make(dt.y, 1, 1)) <= 0;
  if (kind === "monthly" && F.isLastDayOfMarch(dt)) return F.cmp(n, F.make(dt.y, 2, 1)) <= 0;
  return false;
}
let cases = 0, failedChecks = 0, failedCases = 0, rentChecks = 0, rentCases = 0, dec31Checks = 0, dec31Cases = 0;
for (let day = F.parseISO("2026-01-01"); F.cmp(day, F.parseISO("2030-01-01")) < 0; day = F.addDays(day, 1)) {
  for (const due of [1, 2, 15, 28, 29, 30, 31]) {
    const r = F.compute({ noticeDate: F.toISO(day), kind: "monthly", dueDay: due });
    const n = F.parseISO(r.notice), t = F.parseISO(r.termination); let k = 0; cases++;
    if (!periodEnd(t, "monthly", due)) k++;
    if (!legal(n, t, "monthly")) k++;
    for (let x = F.addDays(n, 1); F.cmp(x, t) < 0; x = F.addDays(x, 1)) if (periodEnd(x, "monthly", due) && legal(n, x, "monthly")) { k++; break; }
    if (k) { failedCases++; failedChecks += k; if (due >= 29) { rentCases++; rentChecks += k; } else { dec31Cases++; dec31Checks += k; eq("other failure is a December 31 notice", F.toISO(day).slice(5), "12-31"); } }
  }
  for (let pay = 0; pay < 7; pay++) {
    const r = F.compute({ noticeDate: F.toISO(day), kind: "weekly", payWeekday: pay });
    const n = F.parseISO(r.notice), t = F.parseISO(r.termination); cases++;
    let k = 0; if (!periodEnd(t, "weekly", 0, pay) || !legal(n, t, "weekly")) k++; if (between(n, t) > 34) k++;
    if (k) { failedCases++; failedChecks += k; }
  }
}
eq("first run: cases", cases, 20454);
eq("first run: failed checks", failedChecks, 1650);
eq("first run: failing cases", failedCases, 850);
eq("first run: rent day 29 to 31, failed checks", rentChecks, 1647);
eq("first run: rent day 29 to 31, failing cases", rentCases, 847);
eq("first run: December 31 notices with rent due on the 1st, failed checks", dec31Checks, 3);
eq("first run: December 31 notices with rent due on the 1st, cases", dec31Cases, 3);

if (failed) { console.error(failed + " failed"); process.exit(1); }
console.log("holiday list, service wording and first run replay tests: " + passed + " passed");
