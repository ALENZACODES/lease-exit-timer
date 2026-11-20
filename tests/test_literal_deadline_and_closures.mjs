// Round 7: the advised day always meets the literal s. 44 (5) date, and the Legislation Act s. 89 (1)
// extension is shown only as the author's reading; December 28 counted as an UNKNOWN Board closure when
// Boxing Day falls on a weekend; the Canada Post wording without a weekend closure claim; the courier
// Saturday assumption; and computed Canada Post years after 2027.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const L = require(join(root, "site/dates.js"));
const app = readFileSync(join(root, "site/app.js"), "utf8");
const rules = readFileSync(join(root, "site/data/rules.json"), "utf8");

let failed = 0, passed = 0;
function eq(name, a, b) {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { passed++; return; }
  failed++; console.error("FAIL", name, "got", A, "expected", B);
}
const D = (iso) => L.parseISO(iso);
const C = (date, extra) => L.compute(Object.assign({ noticeDate: date, kind: "monthly", dueDay: 1, delivery: "hand", emailConsent: true, emailCoversNotice: true }, extra || {}));

// 1. Literal date against the author's reading, by hand, for February 28, 2027.
const h = C("2026-12-20");
eq("hand: end date", h.termination, "2027-02-28");
eq("hand: extended last day kept as the author's reading", h.lastSendDay, "2027-01-02");
eq("hand: literal last day is January 1", [h.lastSendDayLiteral, h.lastNoticeDayLiteral], ["2027-01-01", "2027-01-01"]);
eq("hand: advised day is the literal day", h.lastPracticalSendDay, "2027-01-01");
eq("hand: every method line carries the literal day", h.byMethod.find((x) => x.method === "hand").lastSendDayLiteral, "2027-01-01");
eq("hand: email follows the same literal day", [h.byMethod.find((x) => x.method === "email").lastSendDayLiteral, h.byMethod.find((x) => x.method === "email").lastPracticalSendDay], ["2027-01-01", "2027-01-01"]);
eq("hand: checklist due line uses the literal day", L.n9Checklist(h).find((x) => !x.page).fill.startsWith("01/01/2027"), true);
eq("hand: calendar reminder on the advised day", L.reminderICS(h, "20261119T000000Z").includes("DTSTART;VALUE=DATE:20270101"), true);

// 2. Mail, November 28, 2026: practical December 24, literal December 27, author's reading December 28.
const m = C("2026-11-28", { delivery: "mail" });
eq("mail: three days", [m.lastPracticalSendDay, m.lastSendDayLiteral, m.lastSendDay], ["2026-12-24", "2026-12-27", "2026-12-28"]);
eq("mail: note names Christmas, the Sunday, and Boxing Day observed", /Sunday/.test(m.sendDayNote) && /Christmas Day/.test(m.sendDayNote) && /Boxing Day/.test(m.sendDayNote), true);
eq("mail: note advises a dated receipt", m.sendDayNote.includes("dated receipt"), true);
eq("mail: note names private sector post offices", m.sendDayNote.includes("follow the store's hours"), true);
eq("mail: no unsourced weekend closure claim", /does not make regular collection or delivery on Saturday or Sunday|closed on December 25, the weekend/.test(m.sendDayNote + app + rules), false);
eq("mail: December 24 still reaches February 28", C("2026-12-24", { delivery: "mail" }).termination, "2027-02-28");
eq("mail: December 27 still reaches February 28 on the literal date", L.compute({ noticeDate: "2026-12-27", kind: "monthly", dueDay: 1, delivery: "mail", literalOnly: true }).termination, "2027-02-28");
eq("mail: December 28 needs the extension", [C("2026-12-28", { delivery: "mail" }).termination, L.compute({ noticeDate: "2026-12-28", kind: "monthly", dueDay: 1, delivery: "mail", literalOnly: true }).termination], ["2027-02-28", "2027-03-31"]);

// 3. A notice that only reaches its end date through the extension says what the literal date gives.
const j2 = C("2027-01-02");
eq("January 2 by hand: end date on the author's reading", j2.termination, "2027-02-28");
eq("January 2 by hand: literal alternative", [j2.literalAlternative.valid, j2.literalAlternative.termination], [true, "2027-03-31"]);
eq("January 2 by hand: no literal advised day before the notice", j2.lastSendDayLiteral, undefined);
eq("January 1 by hand: no literal alternative needed", C("2027-01-01").literalAlternative, undefined);
const fx = C("2027-01-02", { kind: "fixed", expiryDate: "2027-02-28" });
eq("fixed term on January 2: valid on the reading, too late on the literal date", [fx.valid, fx.literalAlternative.valid], [true, false]);

// 4. February 1, 2026 is a Sunday: the literal day leads.
const f1 = C("2026-01-15");
eq("March 31, 2026: literal February 1 and extended February 2", [f1.termination, f1.lastSendDayLiteral, f1.lastSendDay], ["2026-03-31", "2026-02-01", "2026-02-02"]);
eq("a non-holiday February 1 has no literal split", C("2027-01-15").lastSendDayLiteral, undefined);

// 5. December 28 as an UNKNOWN Board closure when Boxing Day falls on a weekend.
eq("2026: Monday, December 28 assumed", L.holidaysIn(2026).filter((x) => x.date === "2026-12-28").map((x) => x.kind), ["assumed"]);
eq("2027: Tuesday, December 28 assumed", L.holidaysIn(2027).filter((x) => x.date === "2027-12-28").map((x) => x.kind), ["assumed"]);
eq("2028: Boxing Day on a Tuesday adds nothing", L.holidaysIn(2028).some((x) => x.date === "2028-12-28"), false);
eq("2032: Boxing Day on a Sunday adds Tuesday, December 28", L.holidaysIn(2032).some((x) => x.date === "2032-12-28" && x.kind === "assumed"), true);
eq("December 28 is not a Legislation Act holiday", L.isLegislationHoliday(D("2026-12-28")), false);
const x24 = C("2026-12-24", { delivery: "courier" });
eq("courier December 24, 2026 counts December 29", x24.notice, "2026-12-29");
eq("courier December 24, 2026: with every weekday office open it would count December 25", x24.officeOpen.notice, "2026-12-25");
eq("courier December 24, 2026: December 28 listed as UNKNOWN", x24.courierSkipped.map((x) => x.name + ":" + x.kind).pop(), "Boxing Day observed:assumed");
eq("courier note: December 28 listed UNKNOWN", app.includes("so that day is listed as UNKNOWN and counted as closed too"), true);

// 6. Courier: the Saturday assumption is said on the page.
const cou = C("2026-12-31", { delivery: "courier" });
eq("courier: legal Sunday, practical Friday", [cou.lastSendDay, cou.lastPracticalSendDay], ["2027-01-31", "2027-01-29"]);
eq("courier: Saturday hand off named", cou.sendDayNote.includes("Saturday, January 30, 2027") && cou.sendDayNote.includes("if your courier picks up on Saturdays"), true);
eq("courier: Saturday counts the same day as Sunday", L.deemedGiven(D("2027-01-30"), "courier").d === L.deemedGiven(D("2027-01-31"), "courier").d, true);

// 7. Canada Post years after 2027 are computed and include the five weekday closures in the official table.
for (let y = 2028; y <= 2035; y++) {
  const names = L.canadaPostHolidaysIn(y).map((x) => x.name);
  for (const n of ["National Day for Truth and Reconciliation", "Remembrance Day", "Civic Holiday", "Good Friday", "Easter Monday"]) eq("Canada Post " + y + " lists " + n, names.some((x) => x.startsWith(n)), true);
  eq("Canada Post " + y + " is computed, not published", L.canadaPostHolidaysIn(y).every((x) => x.published === false), true);
}
eq("Canada Post 2028: September 30 is a Saturday, observed Monday, October 2", L.canadaPostHolidaysIn(2028).some((x) => x.date === "2028-10-02"), true);

// 8. Statute wording on the page.
eq("s. 87 points to s. 88, Sunday cited to s. 88 (2)", app.includes("Section 88 (2) lists Sunday") && !app.includes("which is a Sunday or a day on the s. 88 list"), true);
eq("rule 1.15 quoted", app.includes("A notice or document may be delivered to a party or person on a holiday and a notice may take effect on a holiday."), true);
eq("author's reading line on the page", app.includes('id="authors-reading"') && app.includes('id="literal-alternative"'), true);

if (failed) { console.error(failed + " failed"); process.exit(1); }
console.log("literal deadline and closure tests: " + passed + " passed");
