// Delivery method, rent due day edge cases, fixed term fallback, and the calendar reminder.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const L = require(join(root, "site/dates.js"));

let failed = 0, passed = 0;
function eq(name, a, b) {
  if (a === b) { passed++; return; }
  failed++; console.error("FAIL", name, "got", a, "expected", b);
}

// RTA s. 191 (3): mail is deemed given on the fifth day after mailing.
const mail = L.compute({ noticeDate: "2026-11-27", kind: "monthly", dueDay: 1, delivery: "mail" });
eq("mail deemed day", mail.notice, "2026-12-02");
eq("mail still reaches Jan 31", mail.termination, "2027-01-31");
eq("mail last send day", mail.lastSendDay, "2026-11-27");
const mailLate = L.compute({ noticeDate: "2026-11-28", kind: "monthly", dueDay: 1, delivery: "mail" });
eq("mail one day late slips a month", mailLate.termination, "2027-02-28");

// By hand the same Nov 28 still works for Jan 31, and the last day is Dec 2.
const hand = L.compute({ noticeDate: "2026-11-28", kind: "monthly", dueDay: 1, delivery: "hand" });
eq("hand term", hand.termination, "2027-01-31");
eq("hand last send", hand.lastSendDay, "2026-12-02");
eq("hand 60 days counted", hand.daysOfNotice, 64);

// Email counts on the day it is sent.
const em = L.compute({ noticeDate: "2026-12-02", kind: "monthly", dueDay: 1, delivery: "email", emailConsent: true, emailCoversNotice: true });
eq("email same day", em.notice, "2026-12-02");
eq("email exactly 60 days", em.daysOfNotice, 60);
eq("email term", em.termination, "2027-01-31");

// Courier: next day, moved past a weekend. Friday Nov 27, 2026 counts Monday Nov 30.
const cf = L.compute({ noticeDate: "2026-11-27", kind: "monthly", dueDay: 1, delivery: "courier" });
eq("courier friday to monday", cf.notice, "2026-11-30");
// Last day by hand is Wed Dec 2, so the latest courier hand-off is Tue Dec 1.
eq("courier last send", cf.lastSendDay, "2026-12-01");
eq("courier from saturday", L.deemedGiven(L.parseISO("2026-11-28"), "courier") && L.toISO(L.deemedGiven(L.parseISO("2026-11-28"), "courier")), "2026-11-30");

// Rent due on the 31st: in a 30-day month rent falls due on the 30th, so the period ends on the 29th.
eq("due 31 in April", L.toISO(L.periodEndOnOrAfter(L.parseISO("2027-04-01"), 31)), "2027-04-29");
eq("due 31 in May", L.toISO(L.periodEndOnOrAfter(L.parseISO("2027-05-01"), 31)), "2027-05-30");
eq("due 30 in February", L.toISO(L.periodEndOnOrAfter(L.parseISO("2027-02-01"), 30)), "2027-02-27");
eq("due 1 is month end", L.toISO(L.periodEndOnOrAfter(L.parseISO("2027-02-01"), 1)), "2027-02-28");

// Fixed term too late: s. 38 (1) makes it monthly, so show the next ordinary monthly date.
const late = L.compute({ noticeDate: "2026-11-19", kind: "fixed", expiryDate: "2026-12-31", dueDay: 1 });
eq("late fixed invalid", late.valid, false);
eq("late fixed fallback", late.fallback.termination, "2027-01-31");
const pastFixed = L.compute({ noticeDate: "2026-11-19", kind: "fixed", expiryDate: "2026-11-01" });
eq("expired fixed term asks for monthly", typeof pastFixed.error, "string");

// Fixed term ending on the last day of March can use the February 1 rule.
const fm = L.compute({ noticeDate: "2027-02-01", kind: "fixed", expiryDate: "2027-03-31" });
eq("fixed march special", fm.valid && fm.usedSpecial, true);
const fm2 = L.compute({ noticeDate: "2027-02-02", kind: "fixed", expiryDate: "2027-03-31" });
eq("fixed march one day late", fm2.valid, false);

// Weekly tenancies never get the winter rule.
const wk = L.compute({ noticeDate: "2027-01-01", kind: "weekly", payWeekday: 1 });
eq("weekly no special", wk.usedSpecial, false);
eq("weekly ends sunday", L.weekday(L.parseISO(wk.termination)), 0);

// Bad input is refused, not guessed.
eq("bad date", typeof L.compute({ noticeDate: "2026-02-30", kind: "monthly", dueDay: 1 }).error, "string");
eq("bad due day", typeof L.compute({ noticeDate: "2026-11-19", kind: "monthly", dueDay: 0 }).error, "string");
eq("bad kind", typeof L.compute({ noticeDate: "2026-11-19", kind: "yearly" }).error, "string");

// Calendar reminder
const ics = L.reminderICS(hand, "20261119T150000Z");
eq("ics start", ics.includes("DTSTART;VALUE=DATE:20261202"), true);
eq("ics crlf", ics.includes("\r\nEND:VCALENDAR\r\n"), true);
eq("ics alarm", ics.includes("TRIGGER:-P7D"), true);
eq("no ics when invalid", L.reminderICS(late), "");

if (failed) { console.error(failed + " failed, " + passed + " passed"); process.exit(1); }
console.log("delivery tests: " + passed + " passed");
