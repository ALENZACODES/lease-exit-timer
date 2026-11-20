// Round 9: the mailing day safeguard says plainly that the day a counter accepts the letter is what can be
// shown, and what to do when no counter can accept it in time; LTB rule 3.9 and the time of day for email,
// checked against the Rules of Procedure text (updated September 21, 2026, read November 20, 2026).
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
const C = (date, extra) => L.compute(Object.assign({ noticeDate: date, kind: "monthly", dueDay: 1, delivery: "hand", emailConsent: true, emailCoversNotice: true }, extra || {}));

// 1. The November 28 mail case: counter, not street box; what to do if no counter can accept it in time.
const m = C("2026-11-28", { delivery: "mail" });
eq("mail: practical day unchanged", m.lastPracticalSendDay, "2026-12-24");
eq("mail: hand it over a counter, not into a street box", m.sendDayNote.includes("Hand it over a post office counter, not into a street box, so the day it was accepted can be shown."), true);
eq("mail: the receipt is still evidence, not a guarantee", m.sendDayNote.includes("It is evidence of the day you mailed it, not a guarantee of how the Board will count it."), true);
eq("mail: if no counter can accept it by the advised day", m.sendDayNote.includes("If no counter can accept it by Thursday, December 24, 2026, do not count on a street box or a later postmark"), true);
eq("mail: points to hand delivery and consented email, each only if it fits", m.sendDayNote.includes("Two other ways may still work, each only if it fits your case: giving it by hand by the last day shown for hand delivery in the line that lists every method") && m.sendDayNote.includes("or email, only if the landlord's written consent covers this notice."), true);
eq("mail: never calls a street box a safe mailing", /street box (is|counts as) (safe|legal|guaranteed)/i.test(m.sendDayNote), false);
const hand = m.byMethod.find((x) => x.method === "hand");
eq("mail: by hand, the last day for the same end date is later than the advised mail day", hand && (hand.lastSendDayLiteral || hand.lastSendDay) > m.lastPracticalSendDay, true);
eq("mail: by hand the literal last day is January 1, 2027", hand && (hand.lastSendDayLiteral || hand.lastSendDay), "2027-01-01");
const plain = C("2026-10-01", { delivery: "mail" });
eq("mail: no safeguard note when the practical and legal days are the same", plain.sendDayNote === undefined || plain.sendDayNote.includes("If no counter can accept it"), true);

// 2. Email: rule 3.9 counts the day it was sent and sets no time of day.
const ltb = rules.sources.find((x) => x.name.startsWith("Landlord and Tenant Board Rules of Procedure"));
eq("rules.json: rule 3.9 email counts the day it was sent", ltb.note.includes("email counts the day it was sent"), true);
eq("rules.json: no time of day cutoff for email, with the rules' dates", ltb.note.includes("Rule 3.9 sets no time of day for email service") && ltb.note.includes("updated September 21, 2026"), true);
eq("page: email reason cites rule 3.9 and no evening cutoff", app.includes("counts on the day it is sent (LTB rule 3.9)") && app.includes("no evening cutoff for email"), true);
eq("page: email note says send early and keep the sent email", app.includes("Send it early on the last day anyway, and keep the sent email with its date and time."), true);
const e = C("2026-12-02", { delivery: "email" });
eq("email: counts the day it is sent", e.notice, "2026-12-02");

if (failed) { console.error(failed + " failed"); process.exit(1); }
console.log("mailing safeguards and email tests: " + passed + " passed");
