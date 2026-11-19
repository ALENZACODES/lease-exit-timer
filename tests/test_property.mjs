// Brute force check against an oracle. The oracle below does its own date arithmetic with the built-in Date
// object and has its own hard-coded table of 2026 to 2029 holidays, typed in from the Legislation Act, 2006,
// s. 88 (2) to (5). It imports only the two engine functions it tests, compute() and holidaysIn(), and calls
// none of the engine's date helpers. The code is independent; the reading of the law is not. The same author
// typed this table from the same reading of s. 88 and LTB rules 1.1 and 3.9, so a shared misreading would pass
// both. For every start day from 1 January 2026 to 31 December 2029, every delivery method, and every kind of
// tenancy the page offers (monthly with seven rent days, weekly with seven pay days, daily, and fixed terms
// ending one to four months out), the engine must give exactly the oracle's answer.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const L = require(join(root, "site/dates.js"));

// Hard-coded holidays. "s" = statutory (s. 88), "a" = assumed office closure (Civic Holiday).
const HOLIDAYS = {
  "2026-01-01": "s", "2026-02-16": "s", "2026-04-03": "s", "2026-04-06": "s", "2026-05-18": "s", "2026-07-01": "s",
  "2026-08-03": "a", "2026-09-07": "s", "2026-10-12": "s", "2026-11-11": "s", "2026-12-25": "s", "2026-12-26": "s",
  "2027-01-01": "s", "2027-02-15": "s", "2027-03-26": "s", "2027-03-29": "s", "2027-05-24": "s", "2027-07-01": "s",
  "2027-08-02": "a", "2027-09-06": "s", "2027-10-11": "s", "2027-11-11": "s", "2027-12-25": "s", "2027-12-26": "s",
  "2027-12-27": "s", // s. 88 (5): Christmas Day on a Saturday, so the Monday after is also a holiday
  "2028-01-01": "s", "2028-02-21": "s", "2028-04-14": "s", "2028-04-17": "s", "2028-05-22": "s", "2028-07-01": "s",
  "2028-08-07": "a", "2028-09-04": "s", "2028-10-09": "s", "2028-11-11": "s", "2028-12-25": "s", "2028-12-26": "s",
  "2029-01-01": "s", "2029-02-19": "s", "2029-03-30": "s", "2029-04-02": "s", "2029-05-21": "s",
  "2029-07-02": "s", // s. 88 (4): Canada Day falls on a Sunday, so it is kept on July 2
  "2029-08-06": "a", "2029-09-03": "s", "2029-10-08": "s", "2029-11-11": "s", "2029-12-25": "s", "2029-12-26": "s",
  "2030-01-01": "s"
};

const DAY = 86400000;
const D = (iso) => Date.parse(iso + "T00:00:00Z");
const I = (ms) => new Date(ms).toISOString().slice(0, 10);
const add = (iso, n) => I(D(iso) + n * DAY);
const between = (a, b) => Math.round((D(b) - D(a)) / DAY);
const wd = (iso) => new Date(D(iso)).getUTCDay();
const dim = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const ymd = (iso) => iso.split("-").map(Number);
function closed(iso, assumed, weekdays = true) {
  const w = wd(iso);
  if (w === 0 || w === 6) return true;
  if (!weekdays) return false;
  const k = HOLIDAYS[iso];
  return k === "s" || (k === "a" && assumed);
}
function deemed(sent, method, assumed = true, weekdays = true) {
  if (method === "mail") return add(sent, 5);
  if (method === "courier") { let d = add(sent, 1); while (closed(d, assumed, weekdays)) d = add(d, 1); return d; }
  return sent;
}
function lastFeb(iso) { const [y, m, d] = ymd(iso); return m === 2 && d === dim(y, 2); }
function lastMar(iso) { const [, m, d] = ymd(iso); return m === 3 && d === 31; }
function legal(notice, t, kind) {
  const min = kind === "weekly" || kind === "daily" ? 28 : 60;
  if (between(notice, t) >= min) return true;
  if (kind === "weekly" || kind === "daily") return false;
  const y = ymd(t)[0];
  // s. 44 (5) deadlines, extended by Legislation Act s. 89 (1) past a Sunday or an s. 88 day (not a Saturday).
  const ext = (iso) => { while (wd(iso) === 0 || HOLIDAYS[iso] === "s") iso = add(iso, 1); return iso; };
  if (lastFeb(t)) return notice <= ext(y + "-01-01");
  if (lastMar(t)) return notice <= ext(y + "-02-01");
  return false;
}
function periodEnd(t, kind, due, pay) {
  if (kind === "daily") return true;
  if (kind === "weekly") return wd(t) === (pay + 6) % 7;
  const [y, m, d] = ymd(add(t, 1));
  return d === Math.min(due, dim(y, m));
}
function earliest(notice, kind, due, pay) {
  for (let t = add(notice, 1), i = 0; i < 200; i++, t = add(t, 1)) if (periodEnd(t, kind, due, pay) && legal(notice, t, kind)) return t;
  throw new Error("oracle found no date");
}
function lastNotice(t, kind) { let n = t; while (!legal(n, t, kind)) n = add(n, -1); return n; }
function lastSend(n, method) { let s = n; while (deemed(s, method) > n) s = add(s, -1); return s; }

let checks = 0, failed = 0, courierChecks = 0, holidayChecks = 0;
function fail(msg) { failed++; if (failed < 20) console.error("FAIL", msg); }
const OK = { emailConsent: true, emailCoversNotice: true };

// The engine's holiday list must match the typed table, kind for kind.
for (let y = 2026; y <= 2029; y++) {
  const mine = Object.entries(HOLIDAYS).filter(([d]) => d.startsWith(y + "-")).map(([d, k]) => d + k).join(",");
  const theirs = L.holidaysIn(y).map((h) => h.date + (h.kind === "assumed" ? "a" : "s")).join(",");
  holidayChecks++;
  if (mine !== theirs) fail(`holidays ${y}: table ${mine} engine ${theirs}`);
}

function expectSame(label, r, exp) {
  checks++;
  for (const k of Object.keys(exp)) if (r[k] !== exp[k]) { fail(`${label}: ${k} engine ${r[k]} oracle ${exp[k]}`); return; }
}
const methods = ["hand", "email", "courier", "mail"];
const dues = [1, 2, 15, 28, 29, 30, 31];
for (let sent = "2026-01-01"; sent < "2030-01-01"; sent = add(sent, 1)) {
  for (const method of methods) {
    const notice = deemed(sent, method);
    const base = { noticeDate: sent, delivery: method, ...OK };
    for (const due of dues) {
      const t = earliest(notice, "monthly", due), n = lastNotice(t, "monthly");
      expectSame(`${sent} ${method} monthly ${due}`, L.compute({ ...base, kind: "monthly", dueDay: due }), { notice, termination: t, lastNoticeDay: n, lastSendDay: lastSend(n, method), valid: true });
    }
    for (let pay = 0; pay < 7; pay++) {
      const t = earliest(notice, "weekly", 0, pay), n = lastNotice(t, "weekly");
      expectSame(`${sent} ${method} weekly ${pay}`, L.compute({ ...base, kind: "weekly", payWeekday: pay }), { notice, termination: t, lastNoticeDay: n, lastSendDay: lastSend(n, method), valid: true });
    }
    {
      const t = earliest(notice, "daily"), n = lastNotice(t, "daily");
      expectSame(`${sent} ${method} daily`, L.compute({ ...base, kind: "daily" }), { notice, termination: t, lastNoticeDay: n, lastSendDay: lastSend(n, method), valid: true });
    }
    const [y, m] = ymd(sent);
    for (let k = 1; k <= 4; k++) {
      const yy = y + Math.floor((m - 1 + k) / 12), mm = ((m - 1 + k) % 12) + 1;
      const expiry = yy + "-" + String(mm).padStart(2, "0") + "-" + String(dim(yy, mm)).padStart(2, "0");
      const r = L.compute({ ...base, kind: "fixed", dueDay: 1, expiryDate: expiry });
      if (expiry <= notice) { checks++; if (!r.error) fail(`${sent} ${method} fixed ${expiry}: expected an error`); continue; }
      const n = lastNotice(expiry, "fixed");
      expectSame(`${sent} ${method} fixed ${expiry}`, r, { notice, termination: expiry, lastNoticeDay: n, lastSendDay: lastSend(n, method), valid: legal(notice, expiry, "fixed") });
    }
  }
  // Courier: the skipped days and the assumed closure note must match the oracle.
  const dg = deemed(sent, "courier"), plain = deemed(sent, "courier", false);
  const r = L.compute({ noticeDate: sent, delivery: "courier", kind: "monthly", dueDay: 1 });
  const skipped = []; for (let x = add(sent, 1); x < dg; x = add(x, 1)) skipped.push(x);
  courierChecks++;
  if (r.courierSkipped.map((h) => h.date).join() !== skipped.join()) fail(`${sent} courier skipped ${r.courierSkipped.map((h) => h.date)} oracle ${skipped}`);
  if ((plain !== dg) !== Boolean(r.assumedClosure)) fail(`${sent} courier assumed closure flag`);
  if (r.assumedClosure && r.assumedClosure.notice !== plain) fail(`${sent} courier without assumed closure ${r.assumedClosure.notice} oracle ${plain}`);
  // Kinds: a Saturday or Sunday is a weekend day even when it is also on the list.
  const kinds = skipped.map((x) => (wd(x) === 0 || wd(x) === 6 ? "weekend" : HOLIDAYS[x] === "a" ? "assumed" : "statutory"));
  if (r.courierSkipped.map((h) => h.kind).join() !== kinds.join()) fail(`${sent} courier kinds ${r.courierSkipped.map((h) => h.kind)} oracle ${kinds}`);
  // Offices open on every weekday: weekends only.
  const open = deemed(sent, "courier", true, false);
  if ((open !== dg) !== Boolean(r.officeOpen)) fail(`${sent} courier office open flag`);
  if (r.officeOpen && r.officeOpen.notice !== open) fail(`${sent} courier offices open ${r.officeOpen.notice} oracle ${open}`);
  // The same end date by every method.
  if (r.valid) {
    const n = lastNotice(r.termination, "monthly");
    for (const x of r.byMethod) if (x.lastSendDay !== lastSend(n, x.method)) fail(`${sent} by method ${x.method} ${x.lastSendDay} oracle ${lastSend(n, x.method)}`);
  }
}
if (failed) { console.error(failed + " failed out of " + checks); process.exit(1); }
console.log("property tests (separate oracle): " + checks + " cases passed, plus " + courierChecks + " courier holiday cases and " + holidayChecks + " holiday tables");
