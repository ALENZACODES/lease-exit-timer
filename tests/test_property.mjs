// Brute force check: for every start day from 2026 through 2029, every kind, every rent day and every
// delivery method, the answer must be a legal date and no earlier legal date may exist.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const L = require(join(root, "site/dates.js"));

let checks = 0, failed = 0;
function fail(msg) { failed++; if (failed < 20) console.error("FAIL", msg); }

function isPeriodEnd(dt, kind, due, pay) {
  if (kind === "daily") return true;
  if (kind === "weekly") return L.weekday(dt) === (pay + 6) % 7;
  const nextDay = L.addDays(dt, 1);
  return nextDay.d === Math.min(due, L.daysInMonth(nextDay.y, nextDay.m));
}
function legal(notice, dt, kind) {
  const min = kind === "weekly" || kind === "daily" ? 28 : 60;
  if (L.daysBetween(notice, dt) >= min) return true;
  if (kind === "monthly" && L.isLastDayOfFebruary(dt)) return L.cmp(notice, L.make(dt.y, 1, 1)) <= 0;
  if (kind === "monthly" && L.isLastDayOfMarch(dt)) return L.cmp(notice, L.make(dt.y, 2, 1)) <= 0;
  return false;
}

let day = L.parseISO("2026-01-01");
const stop = L.parseISO("2030-01-01");
const methods = ["hand", "email", "courier", "mail"];
const OK = { emailConsent: true, emailCoversNotice: true };
let courierChecks = 0;
const dues = [1, 2, 15, 28, 29, 30, 31];
while (L.cmp(day, stop) < 0) {
  const iso = L.toISO(day);
  for (const method of methods) {
    for (const due of dues) {
      const r = L.compute({ noticeDate: iso, kind: "monthly", dueDay: due, delivery: method, ...OK });
      const notice = L.parseISO(r.notice), t = L.parseISO(r.termination);
      checks++;
      if (!isPeriodEnd(t, "monthly", due)) fail(`${iso} ${method} due ${due}: ${r.termination} is not a period end`);
      if (!legal(notice, t, "monthly")) fail(`${iso} ${method} due ${due}: ${r.termination} is too early`);
      for (let x = L.addDays(notice, 1); L.cmp(x, t) < 0; x = L.addDays(x, 1)) {
        if (isPeriodEnd(x, "monthly", due) && legal(notice, x, "monthly")) { fail(`${iso} ${method} due ${due}: earlier ${L.toISO(x)} was legal`); break; }
      }
      // The last send day must still produce the same termination date, and the day after must not.
      const s = L.compute({ noticeDate: r.lastSendDay, kind: "monthly", dueDay: due, delivery: method, ...OK });
      if (s.termination !== r.termination) fail(`${iso} ${method} due ${due}: last send day ${r.lastSendDay} gives ${s.termination}`);
      const after = L.compute({ noticeDate: L.toISO(L.addDays(L.parseISO(r.lastSendDay), 1)), kind: "monthly", dueDay: due, delivery: method, ...OK });
      if (after.termination === r.termination) fail(`${iso} ${method} due ${due}: day after last send day still gives ${r.termination}`);
    }
    for (let pay = 0; pay < 7; pay++) {
      const r = L.compute({ noticeDate: iso, kind: "weekly", payWeekday: pay, delivery: method, ...OK });
      const notice = L.parseISO(r.notice), t = L.parseISO(r.termination);
      checks++;
      if (!isPeriodEnd(t, "weekly", 0, pay) || !legal(notice, t, "weekly")) fail(`${iso} weekly ${pay}: ${r.termination}`);
      if (L.daysBetween(notice, t) > 34) fail(`${iso} weekly ${pay}: more than one week of slack`);
    }
  }
  // Courier: the deemed day must be the first day after hand off that is not a Saturday, Sunday or holiday.
  const dg = L.deemedGiven(day, "courier");
  courierChecks++;
  if (L.isCourierHoliday(dg)) fail(`${iso} courier deemed ${L.toISO(dg)} is a holiday`);
  for (let x = L.addDays(day, 1); L.cmp(x, dg) < 0; x = L.addDays(x, 1)) {
    if (!L.isCourierHoliday(x)) { fail(`${iso} courier skipped working day ${L.toISO(x)}`); break; }
  }
  day = L.addDays(day, 1);
}
if (failed) { console.error(failed + " failed out of " + checks); process.exit(1); }
console.log("property tests: " + checks + " cases passed, plus " + courierChecks + " courier holiday cases");
