// Statutory holidays kept apart from assumed office closures, the one late day cost,
// the service chain from RTA s. 191 (1) (g) to LTB rules 3.1, 3.5 and 3.9, and the Form N9 wording.
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
const kindOf = (iso) => { const h = L.holidayOn(L.parseISO(iso)); return h ? h.kind : null; };
const OK = { emailConsent: true, emailCoversNotice: true };

// Statutory holidays and assumed closures are kept apart.
eq("new year 2027 is statutory", kindOf("2027-01-01"), "statutory");
eq("monday after christmas 2027 is statutory, s. 88 (5)", kindOf("2027-12-27"), "statutory");
eq("civic holiday 2027 is assumed", kindOf("2027-08-02"), "assumed");
eq("civic holiday source says not statutory", L.holidayOn(L.parseISO("2027-08-02")).source.startsWith("Not a statutory holiday"), true);
eq("only civic holiday and boxing day observed are assumed", [2026, 2027, 2028, 2029].map((y) => L.holidaysIn(y).filter((h) => h.kind === "assumed").map((h) => h.name).join()), ["Civic Holiday,Boxing Day observed", "Civic Holiday,Boxing Day observed", "Civic Holiday", "Civic Holiday"]); // round 7: December 28 when Boxing Day falls on a weekend
eq("civic holiday counted by default", L.isCourierHoliday(L.parseISO("2027-08-02")), true);
eq("civic holiday left out on request", L.isCourierHoliday(L.parseISO("2027-08-02"), { assumed: false }), false);
eq("statutory holiday never left out", L.isCourierHoliday(L.parseISO("2027-01-01"), { assumed: false }), true);
eq("weekend never left out", L.isCourierHoliday(L.parseISO("2027-01-02"), { assumed: false }), true);

// Courier skipped days carry their kind.
const dec31 = L.compute({ noticeDate: "2026-12-31", kind: "monthly", dueDay: 1, delivery: "courier" });
eq("dec 31 skipped kinds", dec31.courierSkipped.map((h) => h.kind), ["statutory", "weekend", "weekend"]);
eq("dec 31 no assumed closure", dec31.assumedClosure, undefined);
// Civic Holiday 2027 moves a courier date but not the end date.
const jul30 = L.compute({ noticeDate: "2027-07-30", kind: "monthly", dueDay: 1, delivery: "courier" });
eq("jul 30 2027 courier counts aug 3", jul30.notice, "2027-08-03");
eq("jul 30 2027 skipped kinds", jul30.courierSkipped.map((h) => h.kind), ["weekend", "weekend", "assumed"]);
eq("jul 30 2027 without civic holiday", [jul30.assumedClosure.notice, jul30.assumedClosure.changesEnd], ["2027-08-02", false]);
// And a case where the assumed closure does change the end date: rent due on the 2nd.
const jul30b = L.compute({ noticeDate: "2027-07-30", kind: "monthly", dueDay: 2, delivery: "courier" });
eq("due 2 end with civic holiday counted", jul30b.termination, "2027-11-01");
eq("due 2 end if offices open", [jul30b.assumedClosure.termination, jul30b.assumedClosure.changesEnd], ["2027-10-01", true]);
eq("hand delivery has no assumed closure note", L.compute({ noticeDate: "2027-07-30", kind: "monthly", dueDay: 2, delivery: "hand" }).assumedClosure, undefined);

// One late day cost.
const ord = L.compute({ noticeDate: "2026-11-19", kind: "monthly", dueDay: 1, delivery: "hand", rent: "1850" });
eq("monthly late cost", [ord.lateCost.sendDay, ord.lateCost.termination, ord.lateCost.periods, ord.lateCost.unit, ord.lateCost.amount], ["2026-12-03", "2027-02-28", 1, "month", 1850]);
eq("rent with dollar sign and comma", L.compute({ noticeDate: "2026-11-19", kind: "monthly", dueDay: 1, delivery: "hand", rent: "$2,100.50" }).lateCost.amount, 2100.5);
eq("no rent, no cost line", L.compute({ noticeDate: "2026-11-19", kind: "monthly", dueDay: 1, delivery: "hand" }).lateCost, undefined);
eq("bad rent refused", L.compute({ noticeDate: "2026-11-19", kind: "monthly", dueDay: 1, delivery: "hand", rent: "lots" }).field, "rent");
eq("zero rent refused", L.compute({ noticeDate: "2026-11-19", kind: "monthly", dueDay: 1, delivery: "hand", rent: "0" }).field, "rent");
const mail = L.compute({ noticeDate: "2026-11-27", kind: "monthly", dueDay: 1, delivery: "mail", rent: "1850" });
eq("mail nov 27 last send day", mail.lastSendDay, "2026-11-27");
eq("mail one day late is nov 28 and ends feb 28", [mail.lateCost.sendDay, mail.lateCost.termination], ["2026-11-28", "2027-02-28"]);
eq("mail nov 28 is a saturday, still counts dec 3", [L.weekday(L.parseISO("2026-11-28")), L.compute({ noticeDate: "2026-11-28", kind: "monthly", dueDay: 1, delivery: "mail" }).notice], [6, "2026-12-03"]);
const wk = L.compute({ noticeDate: "2026-11-19", kind: "weekly", payWeekday: 1, delivery: "mail", rent: "400" });
eq("weekly late cost", [wk.lateCost.periods, wk.lateCost.unit, wk.lateCost.amount], [1, "week", 400]);
const dy = L.compute({ noticeDate: "2026-11-19", kind: "daily", delivery: "hand", rent: "60" });
eq("daily late cost", [dy.lateCost.periods, dy.lateCost.unit, dy.lateCost.amount], [1, "day", 60]);
const fx = L.compute({ noticeDate: "2026-11-19", kind: "fixed", dueDay: 1, expiryDate: "2027-08-31", delivery: "hand", rent: "1850" });
eq("fixed late cost goes to the monthly fallback", [fx.lastSendDay, fx.lateCost.termination, fx.lateCost.periods, fx.lateCost.viaFallback], ["2027-07-02", "2027-09-30", 1, true]);
const feb = L.compute({ noticeDate: "2027-01-01", kind: "monthly", dueDay: 1, delivery: "hand", rent: "1000" });
eq("february rule late cost", [feb.termination, feb.lateCost.termination, feb.lateCost.amount], ["2027-02-28", "2027-03-31", 1000]);
eq("rent 31st, months count by period", L.monthsBetween(L.parseISO("2027-01-30"), L.parseISO("2027-03-30"), 31), 2);
eq("late fixed term has no cost line", L.compute({ noticeDate: "2026-11-19", kind: "fixed", dueDay: 1, expiryDate: "2026-12-31", delivery: "hand", rent: "1850" }).lateCost, undefined);
eq("email late cost", L.compute({ noticeDate: "2026-11-19", kind: "monthly", dueDay: 1, delivery: "email", rent: "1850", ...OK }).lateCost.amount, 1850);

// Service chain in rules.json.
const chain = rules.service_chain;
eq("chain starts at s. 191 (1) (g)", chain.links[0].from, "RTA s. 191 (1) (g)");
eq("chain quotes clause (g)", chain.links[0].text, '"by any other means allowed in the Rules"');
eq("chain names rules 3.1, 3.5 and 3.9", ["LTB rule 3.1", "LTB rule 3.5", "LTB rule 3.9"].every((r) => chain.links.some((l) => l.from === r)), true);
eq("chain defines Rules from s. 2 (1)", chain.links.some((l) => l.from === "RTA s. 2 (1)"), true);
eq("chain states its reading", chain.assumptions.length, 3);
eq("courier source names 191 (1) (g) and 3.1", rules.delivery_rules.find((d) => d.id === "courier").source.includes("191 (1) (g)") && rules.delivery_rules.find((d) => d.id === "courier").source.includes("3.1"), true);
eq("email source names rule 3.6", rules.delivery_rules.find((d) => d.id === "email").source.includes("3.6"), true);
eq("holiday kinds listed", Object.keys(rules.holiday_kinds), ["weekend", "statutory", "assumed", "effect", "unknown"]);
eq("page renders the chain", app.includes("service_chain") && page.includes('id="chain-copy"'), true);

// Form N9 wording.
eq("n9 scope wording", rules.n9_scope.startsWith("Every field the tenant or representative must complete"), true);
eq("page n9 wording", app.includes("Every field the tenant or representative must complete"), true);
eq("page says office use box is for the Board", app.includes("Office Use Only"), true);
eq("no claim of every field on the form", /every field on the (official )?form/i.test(app + page + JSON.stringify(rules)), false);
eq("rent field on the page", page.includes('id="rent"') && page.includes("(optional)"), true);

// Self walkthrough fix: a last send day on a weekend or statutory holiday gets the last working day.
eq("courier last send day sunday", [dec31.lastSendDay, dec31.lastWorkingSendDay], ["2027-01-31", "2027-01-29"]);
// The literal January 1 date in s. 44 (5) makes the last legal mail day Sunday, December 27, 2026. The author's
// reading of s. 89 (1) would allow Monday, December 28, 2026, but Canada Post is closed that day (Boxing Day
// observed). The advised send day is Thursday, December 24, 2026.
{ const r = L.compute({ noticeDate: "2026-11-28", kind: "monthly", dueDay: 1, delivery: "mail" });
  eq("mail last send day over christmas", [r.lastSendDay, r.lastSendDayLiteral, r.lastWorkingSendDay, r.lastPracticalSendDay], ["2026-12-28", "2026-12-27", "2026-12-24", "2026-12-24"]);
  eq("mail note names Boxing Day and December 24", /Boxing Day/.test(r.sendDayNote) && r.sendDayNote.includes("Thursday, December 24, 2026"), true); }
eq("weekday last send day has no note", L.compute({ noticeDate: "2026-11-19", kind: "monthly", dueDay: 1, delivery: "mail" }).sendDayNote, undefined);
eq("hand delivery on a sunday has no note", L.compute({ noticeDate: "2027-01-01", kind: "monthly", dueDay: 1, delivery: "hand" }).sendDayNote, undefined);
eq("checklist due line kept out of the numbered fields", app.includes("items.filter((it) => it.page)") && app.includes("n9-due"), true);
eq("chain quotes rule 3.1 pieces separately", rules.service_chain.links.find((l) => l.from === "LTB rule 3.1").text.startsWith('"courier to party\'s address" and'), true);

if (failed) { console.error(failed + " failed"); process.exit(1); }
console.log("statutory service and N9 tests: " + passed + " passed");
