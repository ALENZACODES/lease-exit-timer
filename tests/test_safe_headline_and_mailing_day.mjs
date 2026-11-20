// Round 8: the safe literal end date leads whenever an earlier end date needs the s. 89 (1) reading; the
// exact s. 44 (5) text and its scope; the theoretical last mailing day kept apart from a day with confirmed
// collection; a dated receipt treated as evidence, not proof; Canada Post's published 2026 and 2027 schedule
// kept apart from the dates this page calculates for 2028 to 2035; and wording checks across the repo.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, readdirSync, statSync } from "fs";
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const L = require(join(root, "site/dates.js"));
const app = readFileSync(join(root, "site/app.js"), "utf8");
const rulesText = readFileSync(join(root, "site/data/rules.json"), "utf8");
const rules = JSON.parse(rulesText);

let failed = 0, passed = 0;
function eq(name, a, b) {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { passed++; return; }
  failed++; console.error("FAIL", name, "got", A, "expected", B);
}
const D = (iso) => L.parseISO(iso);
const C = (date, extra) => L.compute(Object.assign({ noticeDate: date, kind: "monthly", dueDay: 1, delivery: "hand", emailConsent: true, emailCoversNotice: true }, extra || {}));

// 1. The safe end date leads. Claude's error 1: notice by hand on Saturday, January 2, 2027.
const j2 = C("2027-01-02", { rent: "1850" });
eq("January 2: headline March 31", [j2.headline, j2.termination, j2.valid, j2.usedSpecial], ["literal", "2027-03-31", true, false]);
eq("January 2: February 28 only as the contingent line", [j2.readingOnly.termination, j2.readingOnly.deadline, j2.readingOnly.extendedTo], ["2027-02-28", "2027-01-01", "2027-01-02"]);
eq("January 2: checklist end date is the literal one", L.n9Checklist(j2).find((x) => /last day of my tenancy/.test(x.field)).fill, "31/03/2027");
eq("January 2: page has a contingent line", app.includes('id="reading-only"') && app.includes("Contingent, not advised"), true);
eq("January 2: contingent line is announced", app.includes('"reading-only"'), true);
eq("January 1 still ends February 28 with no contingent line", [C("2027-01-01").termination, C("2027-01-01").readingOnly], ["2027-02-28", undefined]);

// Every notice day from 2026 to 2035, by every method, monthly with rent on the 1st: when there is a contingent
// line, the headline is valid on the literal date, later than the contingent date, and on the checklist.
let scanned = 0, contingent = 0, bad = 0;
for (let d = D("2026-01-01"); L.toISO(d) < "2036-01-01"; d = L.addDays(d, 1)) {
  for (const m of ["hand", "mail", "courier", "email"]) {
    const r = C(L.toISO(d), { delivery: m });
    scanned++;
    if (!r.readingOnly) continue;
    contingent++;
    const lit = L.compute({ noticeDate: L.toISO(d), kind: "monthly", dueDay: 1, delivery: m, emailConsent: true, emailCoversNotice: true, literalOnly: true });
    if (!(r.valid && r.termination === lit.termination && r.readingOnly.termination < r.termination && L.n9Checklist(r)[3].fill === L.n9Date(r.termination))) bad++;
  }
}
eq("scan: every contingent case leads with the literal result", bad, 0);
eq("scan: contingent cases exist in the window", contingent > 0, true);

// 2. Section 44 (5) quoted exactly, and its scope: subsections (2), (3) and (4), so fixed terms too.
eq("s. 44 (5) quoted word for word", rules.february_march_rule.statute_text.startsWith("(5) A tenant who gives notice under subsection (2), (3) or (4) which specifies that the termination is to be effective on the last day of February or the last day of March in any year shall be deemed to have given at least 60 days notice of termination if the notice is given not later than January 1 of that year"), true);
eq("s. 44 (5) scope names fixed terms", /fixed terms whose expiry date is the last day of February or the last day of March/.test(rules.february_march_rule.scope), true);
eq("deeming rule noted", /deeming rule, not a time limit/.test(rules.february_march_rule.deeming_note) && app.includes("worded as a deeming rule, not a time limit"), true);
const fx1 = C("2027-01-01", { kind: "fixed", expiryDate: "2027-02-28" });
eq("fixed term to February 28, 2027, notice January 1: valid under s. 44 (5)", [fx1.valid, fx1.usedSpecial, fx1.readingOnly], [true, true, undefined]);
const fx2 = C("2027-02-01", { kind: "fixed", expiryDate: "2027-03-31" });
eq("fixed term to March 31, 2027, notice February 1: valid under s. 44 (5)", [fx2.valid, fx2.usedSpecial], [true, true]);
const fx3 = C("2027-01-01", { kind: "fixed", expiryDate: "2027-02-27" });
eq("fixed term to February 27 is not the last day of February: no special rule", [fx3.valid, fx3.usedSpecial], [false, false]);
const fx4 = C("2027-02-02", { kind: "fixed", expiryDate: "2027-03-31" });
eq("fixed term to March 31, 2027, notice February 2: too late, no reading helps", [fx4.valid, fx4.readingOnly], [false, undefined]);
const fx5 = C("2026-02-02", { kind: "fixed", expiryDate: "2026-03-31" });
eq("fixed term to March 31, 2026, notice Monday February 2: too late on the literal date, contingent on the reading", [fx5.valid, fx5.readingOnly && fx5.readingOnly.valid], [false, true]);
eq("weekly never uses s. 44 (5)", C("2027-01-01", { kind: "weekly", payWeekday: 1 }).usedSpecial, false);
eq("daily never uses s. 44 (5)", C("2027-01-01", { kind: "daily" }).usedSpecial, false);

// 3. Mail: theoretical last mailing day, not a day with confirmed collection; postmark; receipt as evidence.
const m = C("2026-11-28", { delivery: "mail" });
eq("mail: still three days", [m.lastPracticalSendDay, m.lastSendDayLiteral, m.lastSendDay], ["2026-12-24", "2026-12-27", "2026-12-28"]);
eq("mail: Sunday called the theoretical last mailing day", m.sendDayNote.startsWith("Sunday, December 27, 2026 is the theoretical last mailing day"), true);
eq("mail: not a day with confirmed collection", m.sendDayNote.includes("It is not a day with confirmed postal collection"), true);
eq("mail: street box may not be postmarked until Tuesday, December 29", m.sendDayNote.includes("may not be collected or postmarked until Tuesday, December 29, 2026"), true);
eq("mail: receipt is evidence, not proof", m.sendDayNote.includes("It is evidence of the day you mailed it") && !/as proof/.test(m.sendDayNote + app), true);
eq("mail: page legal line says theoretical", app.includes("is the theoretical last mailing day for the legal deadline") && app.includes("Theoretical mailing limit "), true);
eq("mail: checklist says theoretical mailing limit", L.n9Checklist(m).find((x) => !x.page).fill, "24/12/2026 (By mail (Canada Post); theoretical mailing limit 27/12/2026)");
eq("mail: December 28 called a holiday listing, not a categorical closure", m.sendDayNote.includes("is also on Canada Post's holiday list (Boxing Day), with no collection or delivery, though a post office inside a store may keep the store's hours"), true);
eq("hand: checklist still says legal limit", L.n9Checklist(C("2026-12-20")).find((x) => !x.page).fill.includes("theoretical"), false);

// 4. Canada Post: published 2026 and 2027 rows apart from calculated 2028 to 2035 rows.
for (const y of [2026, 2027]) {
  const rows = L.canadaPostHolidaysIn(y);
  eq("PUBLISHED " + y + ": every row published", rows.every((x) => x.published === true && x.source.startsWith("Canada Post official holiday schedule")), true);
}
for (let y = 2028; y <= 2035; y++) {
  const rows = L.canadaPostHolidaysIn(y);
  eq("CALCULATED " + y + ": every row calculated, not published", rows.length > 0 && rows.every((x) => x.published === false && x.source.startsWith("Calculated, not published")), true);
}
eq("rules.json names the published years", rules.canada_post_schedule.published.years, [2026, 2027]);
eq("rules.json names the calculated years", [rules.canada_post_schedule.calculated.years, rules.canada_post_schedule.calculated.status], ["2028 to 2035", "CALCULATED, NOT PUBLISHED"]);
const m31 = C("2031-11-28", { delivery: "mail" });
eq("mail in a calculated year says so", m31.sendDayNote.includes("calculated by this page, not published by Canada Post"), true);
eq("mail in a published year does not", m.sendDayNote.includes("calculated by this page"), false);

// 5. Wording across the repo: no school colour names, no overstated review wording.
function walk(dir, out) {
  for (const f of readdirSync(dir)) {
    if (f === ".git" || f === "node_modules") continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(md|js|mjs|json|css|html|py|svg|txt)$/.test(f) || f === "LICENSE") out.push(p);
  }
  return out;
}
const files = walk(root, []);
const self = fileURLToPath(import.meta.url);
eq("no colour names tied to a school", files.filter((p) => p !== self && /\bPenn\b/i.test(readFileSync(p, "utf8"))).map((p) => p.slice(root.length + 1)), []);
eq("hex colours kept", readFileSync(join(root, "site/styles.css"), "utf8").includes("#011F5B") || readFileSync(join(root, "site/styles.css"), "utf8").includes("#011f5b"), true);
eq("no 'outside review' wording", files.filter((p) => p !== self && /outside (document )?review/i.test(readFileSync(p, "utf8"))).map((p) => p.slice(root.length + 1)), []);

if (failed) { console.error(failed + " failed"); process.exit(1); }
console.log("safe headline and mailing day tests: " + passed + " passed (scan of " + scanned + " notices, " + contingent + " with a contingent line)");
