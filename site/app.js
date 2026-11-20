/* Lease Exit Timer, John Khan. All work stays in this page. */
const $ = (id) => document.getElementById(id);
const L = window.LeaseDates;
let current = null;
const NL = String.fromCharCode(10);

function todayISO() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return ["year", "month", "day"].map((k) => p.find((x) => x.type === k).value).join("-");
}
function pretty(iso) {
  if (!iso) return "";
  const d = L.parseISO(iso);
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(Date.UTC(d.y, d.m - 1, d.d)));
}
function prettyLong(iso) { return iso ? L.prettyLong(L.parseISO(iso)) : ""; }
function advisedDay(out) { return out.lastPracticalSendDay || out.lastSendDay; }
function legalLimit(out) { return out.lastSendDayLiteral || out.lastSendDay; }
function legalDiffers(out) { return out.lastPracticalSendDay && out.lastPracticalSendDay !== legalLimit(out); }
function method() { return document.querySelector('input[name="delivery"]:checked').value; }
function toggleRows() {
  const k = $("kind").value, m = method();
  $("monthly-row").hidden = k !== "monthly" && k !== "fixed";
  $("fixed-row").hidden = k !== "fixed";
  $("weekly-row").hidden = k !== "weekly";
  $("rent-label").textContent = { monthly: "Rent per month", fixed: "Rent per month", weekly: "Rent per week", daily: "Rent per day" }[k] + " (optional)";
  $("email-consent-row").hidden = m !== "email";
  $("courier-warning").hidden = m !== "courier";
  $("delivery-hint").textContent = {
    hand: "Hand it to the landlord or an authorized employee, or leave it where the landlord receives mail.",
    mail: "The date that counts is the fifth day after mailing, not the day you put it in the post. The advised send day uses Canada Post's published closure calendar, including Christmas Day, Boxing Day observed and New Year's Day.",
    courier: "Rule 3.9 counts the day after hand off, or the next day that is not a holiday. Weekends are counted here, and weekday Board closures, which are UNKNOWN, are counted as closed. The advised send day is the last day a courier is likely to pick up, which may be earlier than the legal limit.",
    email: "Email is valid service only with the landlord's written consent (LTB rule 3.5), and that consent should clearly cover a notice to end the tenancy."
  }[m];
}
function draftText(out) {
  if (!out || !out.valid) return "Choose valid ordinary notice dates before making a courtesy note.";
  return [
    "To: " + ($("landlord").value.trim() || "[landlord name]"),
    "From: " + ($("tenant").value.trim() || "[tenant name]"),
    "Rental unit: " + ($("unit").value.trim() || "[rental unit address]"), "",
    "I plan to end my tenancy on " + pretty(out.termination) + " and move out on or before that day.", "",
    "I will complete and give you official Form N9. This message is only a courtesy note, not the official notice.",
    "Official form: https://tribunalsontario.ca/documents/ltb/Notices%20of%20Termination%20%26%20Instructions/N9.pdf"
  ].join(NL);
}
function money(n) { return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n); }
function courierNote(out) {
  const group = (k) => out.courierSkipped.filter((h) => h.kind === k).map((h) => pretty(h.date) + ' (' + h.name + ')');
  const parts = [];
  const wk = group("weekend"), st = group("statutory"), as = group("assumed");
  if (wk.length) parts.push('VERIFIED: Saturday or Sunday, a holiday under LTB rule 1.1 by name: ' + wk.join(", ") + '.');
  if (st.length) parts.push('UNKNOWN, counted as closed: Ontario holiday under the Legislation Act, 2006, s. 88. No Board closure calendar was found for this day: ' + st.join(", ") + '.');
  if (as.length) parts.push('UNKNOWN, counted as closed: not on the s. 88 list, and no Board closure calendar was found for this day: ' + as.join(", ") + '.');
  let html = '<div class="source-note" id="courier-skipped"><p><strong>Courier date moved past these days (LTB rule 3.9).</strong></p><ul>' + parts.map((t) => '<li>' + t + '</li>').join("") + '</ul>';
  if (st.length || as.length) html += '<p id="closure-unknown"><strong>Board closures are UNKNOWN.</strong> Rule 1.1 counts a weekday as a holiday only if the Board\'s offices are closed that day. The Board does not publish a closure calendar that this page could find, so each weekday closure above is marked UNKNOWN and counted as closed. For the listed weekdays, counting a day as closed can only make the notice count later and the advised send day earlier, never later. The list does not include every possible closure. When Boxing Day falls on a weekend, as in 2026, the Legislation Act gives no substitute day, but Canada Post\'s published schedule lists Monday, December 28 as a holiday with no collection or delivery, so that day is listed as UNKNOWN and counted as closed too.</p>';
  const o = out.officeOpen;
  if (o) {
    html += o.changesEnd
      ? '<p>If the Board\'s offices are open on ' + o.days.join(" and ") + ', the notice would count on ' + pretty(o.notice) + ' and an earlier end date of ' + pretty(o.termination) + ' could be available. This page shows the later date, because it does not depend on that guess. Sending one day earlier avoids the question.</p>'
      : '<p>Even if the Board\'s offices are open on ' + o.days.join(" and ") + ', the end date is the same. The notice would count on ' + pretty(o.notice) + '.</p>';
  }
  return html + '</div>';
}
function deadlineNote(out) {
  const ro = out.readingOnly;
  const x = ro ? { deadline: ro.deadline, extendedTo: ro.extendedTo, rule114: ro.rule114 } : out.deadlineExtended;
  if (!x) return "";
  const term = ro ? ro.termination : out.termination;
  return '<div class="source-note" id="deadline-extended"><p><strong>Holiday extension of the ' + (L.parseISO(x.deadline).m === 1 ? "January 1" : "February 1") + ' deadline: the author\'s reading.</strong> Section 44 (5) lets notice given not later than ' + pretty(x.deadline) + ' end the tenancy on ' + pretty(term) + '. That day is a holiday under the Legislation Act, 2006, s. 88. On the author\'s reading of s. 89 (1), the deadline extends to ' + pretty(x.extendedTo) + '. The advised day and the headline end date on this page always meet the literal ' + pretty(x.deadline) + ' date, and the extended day is shown only as a possible later limit.</p>' +
    '<p>The statute text, read on 19 November 2026, America/Toronto, from the official e-Laws site: Legislation Act, 2006, s. 89 (1) says \"Time limits that would otherwise expire on a holiday are extended to include the next day that is not a holiday.\" Section 87 says \"holiday\" means a holiday as described in section 88. Section 88 (2) lists Sunday and the named holidays; Saturday is not on the list. Section 46 says \"Every provision of this Part applies to every Act and regulation.\" Whether s. 89 (1) applies to the fixed dates in s. 44 (5) has not been decided in any case cited here. Section 44 (5) is also worded as a deeming rule, not a time limit: a tenant who gives notice by January 1 or February 1 \"shall be deemed to have given at least 60 days notice\". Section 89 (1) speaks of time limits, so that wording makes the extension weaker still. Section 47 also says s. 46 applies unless \"a contrary intention appears\" or applying it \"would give to a term or provision a meaning that is inconsistent with the context\", and a fixed deeming date may be such a context.</p>' +
    '<p>Giving notice by hand on ' + pretty(x.deadline) + ' itself needs no extension and no Board rule: s. 44 (5) says \"not later than\" that date, which includes the date itself, and a notice handed over under s. 191 (1) is given that day. The page does not rely on the Board\'s Rules of Procedure for this, for the same reason it does not rely on rule 1.14 below: it is not clear those procedural rules govern a notice given before any application. If they do apply, LTB rule 1.15 agrees: \"A notice or document may be delivered to a party or person on a holiday and a notice may take effect on a holiday.\" Courier and email are different, because the Act itself points to the Rules for them (s. 191 (1) (g)). A holiday hand delivery works only if someone can take it or the landlord\'s mail box is reachable that day.</p>' +
    (x.rule114 ? '<p>RTA s. 193 says time is computed under the Board\'s Rules. LTB rule 1.14 could be read to reach ' + pretty(x.rule114) + ', because the Board also treats Saturdays as holidays. This page names that later day and does not rely on it, because it is not clear the Board\'s procedural rules govern a notice given before any application.</p>' : '') +
    '<p>The 60 day and 28 day minimum periods are not extended. They are minimum notice periods, not time limits that expire. No court decision on this point is cited here. This is the author\'s reading of those primary sources, not an adjudicated interpretation.</p></div>';
}
function decision(out) {
  const verb = out.delivery === "hand" ? "Give" : "Send";
  const how = { hand: "by hand", mail: "by Canada Post", courier: "by courier", email: "by email, with written consent" }[out.delivery];
  if (!out.valid) return '<p class="decision" id="decision">It is too late to end this fixed term on ' + pretty(out.termination) + ' by notice' + (out.readingOnly ? ' on the date written in s. 44 (5)' : '') + '.</p>' + readingOnlyNote(out);
  let html = '<p class="decision" id="decision">' + verb + ' Form N9 ' + how + ' by ' + prettyLong(advisedDay(out)) + ' to end your tenancy on ' + pretty(out.termination) + '.</p>';
  if (legalDiffers(out)) html += '<p class="legal-limit" id="legal-limit">' + prettyLong(legalLimit(out)) + (out.delivery === "mail" ? ' is the theoretical last mailing day for the legal deadline' : ' is the last day that would still meet the legal deadline') + (out.lastSendDayLiteral ? ' as written in s. 44 (5)' : '') + '.' + (out.delivery === "mail" ? ' It is not a day with confirmed postal collection.' : '') + '</p>';
  if (out.lastSendDayLiteral) html += '<p class="legal-limit" id="authors-reading">' + prettyLong(out.lastSendDay) + ' could also work, but only on the author\'s reading that Legislation Act s. 89 (1) moves the ' + (L.parseISO(out.lastNoticeDayLiteral).m === 1 ? 'January 1' : 'February 1') + ' date to ' + pretty(out.lastNoticeDay) + '. No tribunal or court decision applying that reading is cited, so this page does not advise relying on it.</p>';
  html += readingOnlyNote(out);
  const alt = out.literalAlternative;
  if (alt && alt.termination !== out.termination) html += '<p class="legal-limit" id="literal-alternative">This end date relies on the author\'s reading of Legislation Act s. 89 (1). On the literal s. 44 (5) date, notice that counts on ' + pretty(out.notice) + ' ' + (alt.valid ? 'would end the tenancy on ' + pretty(alt.termination) : 'would be too late for ' + pretty(out.termination) + (alt.fallback ? ', and the next monthly date to check would be ' + pretty(alt.fallback) : '')) + '. The safer plan is to give notice earlier.</p>';
  return html;
}
// Round 8: a notice that reaches an earlier end date only on the s. 89 (1) reading gets the safe literal
// result as the headline and on the Form N9 checklist. The earlier date is shown here as a contingent line.
function readingOnlyNote(out) {
  const ro = out.readingOnly;
  if (!ro) return "";
  const which = L.parseISO(ro.deadline).m === 1 ? "January 1" : "February 1";
  return '<p class="legal-limit" id="reading-only">Contingent, not advised: notice that counts on ' + pretty(ro.notice) + ' is after the ' + which + ' date written in s. 44 (5). It could end the tenancy on ' + pretty(ro.termination) + ' only on the author\'s reading that Legislation Act s. 89 (1) moves that date to ' + pretty(ro.extendedTo) + '. No tribunal or court decision applying that reading is cited, so this page leads with ' + (out.valid ? pretty(out.termination) + ' and writes that date on the Form N9 checklist' : 'the literal result') + '. If you want to rely on ' + pretty(ro.termination) + ', agree it with your landlord in writing first.</p>';
}
function whyNote(out) {
  const reasons = [];
  if (out.delivery === "mail") reasons.push('Mail counts as given on the fifth day after mailing, s. 191 (3), so notice sent ' + pretty(out.sent) + ' counts on ' + pretty(out.notice) + '.');
  else if (out.delivery === "courier") reasons.push('Courier counts on the day after hand off, or the next day that is not a holiday, LTB rule 3.9, so it counts on ' + pretty(out.notice) + '.');
  else if (out.delivery === "email") reasons.push('Email with written consent (LTB rule 3.5) counts on the day it is sent (LTB rule 3.9), here on ' + pretty(out.notice) + '. Rule 3.9 sets no time of day, so the Rules of Procedure have no evening cutoff for email service under that rule. This is about service under rule 3.9 only, not every kind of electronic filing.');
  else reasons.push('Notice given by hand counts on the day you give it, ' + pretty(out.notice) + '.');
  reasons.push(out.usedSpecial ? 'Section 44 (5) treats notice by January 1 for the end of February, or by February 1 for the end of March, as at least 60 days.' : (out.kind === "weekly" || out.kind === "daily") ? 'Section 44 (1) needs at least 28 days, and the end date must be the last day of a rental period.' : out.kind === "fixed" ? 'Section 44 (4) needs at least 60 days before the expiry date in the agreement, and the notice takes effect on that date.' : 'Section 44 (2) needs at least 60 days, and the end date must be the last day of a rental period.');
  reasons.push('The earliest end date that meets both is ' + pretty(out.termination) + ', ' + out.daysOfNotice + ' days after notice counts.');
  if (legalDiffers(out) && out.sendDayNote) reasons.push(out.sendDayNote);
  return '<details class="why" id="why-this-date"' + (out.deadlineExtended || out.readingOnly || (out.courierSkipped && out.courierSkipped.length) || legalDiffers(out) ? ' open' : '') + '><summary>Why this date</summary><ol>' + reasons.map((r) => '<li>' + r + '</li>').join("") + '</ol>';
}
function methodsNote(out) {
  if (!out.byMethod) return "";
  const name = { hand: "By hand or mail box", mail: "Canada Post", courier: "Courier", email: "Email, with written consent" };
  return '<p class="note" id="by-method"><strong>Same end date, every method.</strong> To end on ' + pretty(out.termination) + ', the last day to send that you can actually use is: ' +
    out.byMethod.map((x) => {
      const day = x.lastPracticalSendDay || x.lastSendDay;
      const lim = x.lastSendDayLiteral || x.lastSendDay;
      const bits = [];
      if (x.lastPracticalSendDay && x.lastPracticalSendDay !== lim) bits.push((x.method === "mail" ? 'theoretical mailing limit ' : 'legal limit ') + pretty(lim));
      if (x.lastSendDayLiteral) bits.push(pretty(x.lastSendDay) + ' on the author\'s reading only');
      const extra = bits.length ? ' (' + bits.join('; ') + ')' : '';
      return (x.method === out.delivery ? '<strong>' : '') + name[x.method] + ' ' + pretty(day) + extra + (x.method === out.delivery ? '</strong>' : '');
    }).join("; ") + '.</p>';
}
function lateNote(out) {
  const c = out.lateCost;
  const unit = c.periods === 1 ? c.unit : c.unit + "s";
  const per = { week: "rent per week", day: "rent per day", month: "rent per month" }[c.unit];
  return '<p class="note" id="late-cost"><strong>Missing the last day by one day moves the end date by ' + c.periods + ' ' + unit + ', about ' + money(c.amount) + ' more rent.</strong> ' + (out.delivery === "hand" ? "Giving" : "Sending") + ' it on ' + pretty(c.sendDay) + ' instead would make the earliest end date ' + pretty(c.termination) + (c.viaFallback ? ' as a monthly tenancy after the fixed term' : '') + '. The estimate is ' + c.periods + ' ' + unit + ' times the ' + per + ' you typed, ' + money(c.rent) + '. It is not a bill. If you move out early anyway, s. 16 of the Act gives a landlord who claims rent a duty to take reasonable steps to minimize losses, and you and your landlord can also agree in writing to end on another date.</p>';
}
function render(out) {
  current = out;
  $("copy-status").textContent = "";
  $("actions").hidden = !out.valid;
  if (out.error) {
    $("result").innerHTML = '<div class="error"><strong>Check one detail.</strong><p>' + out.error + '</p></div>';
    $("live-summary").textContent = "Check one detail. " + out.error;
    $("draft").textContent = "";
    return;
  }
  const fixed = out.kind === "fixed";
  const label = fixed ? "FIXED TERM EXPIRY" : "EARLIEST ORDINARY END DATE";
  const late = !out.valid;
  const steps = [
    ['You ' + (out.delivery === "mail" || out.delivery === "courier" || out.delivery === "email" ? "send" : "give") + ' it', pretty(out.sent)],
    ['Notice counts as given', pretty(out.notice)],
    [out.usedSpecial ? "February and March rule" : "Notice period met", out.daysOfNotice + " days counted"],
    [fixed ? "Fixed term ends" : "Rental period ends", pretty(out.termination)]
  ];
  let html = decision(out) + (late
    ? '<p class="flag">TOO LATE FOR THIS FIXED TERM</p><h3 class="date late">' + pretty(out.termination) + '</h3>'
    : '<p class="flag">' + label + '</p><h3 class="date">' + pretty(out.termination) + '</h3>');
  html += '<p>' + out.message + '</p>';
  (out.notes || []).forEach((n) => { html += '<p class="note">' + n + '</p>'; });
  if (!late) {
    html += '<div class="deadline"><span>LAST DAY TO ' + (out.delivery === "hand" ? "GIVE" : "SEND") + ' IT THIS WAY</span><strong>' + prettyLong(advisedDay(out)) + '</strong><small>' + (legalDiffers(out) ? (out.delivery === "mail" ? 'Theoretical mailing limit ' : 'Legal limit ') + prettyLong(legalLimit(out)) + '. ' : '') + (out.lastSendDayLiteral ? prettyLong(out.lastSendDay) + ' on the author\'s reading only. ' : '') + 'For notice that counts by ' + pretty(out.lastSendDayLiteral ? out.lastNoticeDayLiteral : out.lastNoticeDay) + '</small></div>';
    html += '<ol class="timeline">' + steps.map((s) => '<li><span>' + s[0] + '</span><strong>' + s[1] + '</strong></li>').join("") + '</ol>';
    if (out.valid) html += methodsNote(out);
    html += whyNote(out) + deadlineNote(out);
    if (out.delivery === "courier" && out.courierSkipped && out.courierSkipped.length) html += courierNote(out);
    html += '</details>';
    if (out.lateCost) html += lateNote(out);
    if (out.sendDayNote) html += '<p class="note" id="send-day-note">' + out.sendDayNote + '</p>';
    if (out.delivery === "email") html += '<p class="note" id="email-note">Put your name and phone number in the email, attach the signed Form N9, and keep a copy of the sent email and of the written consent. LTB rule 3.9 counts an email as served on the day it was sent and sets no time of day cutoff (Rules of Procedure, updated September 21, 2026, read November 20, 2026). Send it early on the last day anyway, and keep the sent email with its date and time.</p>';
    const items = L.n9Checklist(out);
    html += '<div class="n9" id="n9-checklist"><p class="flag">FORM N9 CHECKLIST</p><p class="hint">Every field the tenant or representative must complete on the official form, with your date filled in. The Office Use Only box on page 3 is for the Board. This page does not fill in, sign or send Form N9, and the courtesy note further down is not Form N9.</p><ol>' + items.filter((it) => it.page).map((it) => '<li><span>Page ' + it.page + ': ' + it.field + '</span><strong>' + it.fill + '</strong></li>').join("") + '</ol>' + items.filter((it) => !it.page).map((it) => '<p class="n9-due"><span>' + it.field + '</span> <strong>' + it.fill + '</strong></p>').join("") + '</div>';
    if (out.usedSpecial) html += '<p class="source-note">Section 44 (5) treats notice by January 1 for the end of February, or by February 1 for the end of March, as at least 60 days.</p>';
    if (Number($("due").value) > 28 && (out.kind === "monthly" || out.kind === "fixed")) html += '<p class="note">Your rent day is 29, 30 or 31. This calculation assumes rent is due on the last day in months without that date. Confirm the rental period in your agreement before using this result.</p>';
  } else {
    html += '<p>The last day notice could count as given for that expiry was <strong>' + pretty(out.lastNoticeDay) + '</strong>.</p>';
    if (out.fallback) html += '<div class="fallback"><strong>A later ordinary date to check</strong><h4>' + pretty(out.fallback.termination) + '</h4><p>Under section 38 (1), a fixed term that ends without notice continues as a monthly tenancy. With the rent day entered, this is the next ordinary monthly date to check. It is not an early exit from the fixed term.</p><button id="use-monthly" type="button" class="secondary">Show the monthly plan</button></div>';
  }
  html += '<a class="official-link" href="https://tribunalsontario.ca/documents/ltb/Notices%20of%20Termination%20%26%20Instructions/N9.pdf">Open official Form N9 <span aria-hidden="true">↗</span></a>';
  $("result").innerHTML = html;
  // Only the decision and the limits are announced, not the whole result, so a change is short to hear.
  $("live-summary").textContent = ["decision", "legal-limit", "authors-reading", "reading-only", "literal-alternative"].map((id) => $(id)).filter(Boolean).map((el) => el.textContent).join(" ");
  $("draft").textContent = draftText(out);
  const use = $("use-monthly");
  if (use) use.addEventListener("click", () => { $("kind").value = "monthly"; toggleRows(); run(); });
}
function run() {
  toggleRows();
  const out = L.compute({ noticeDate: $("notice").value, kind: $("kind").value, dueDay: $("due").value, expiryDate: $("expiry").value, payWeekday: $("payday").value, delivery: method(), rent: $("rent").value, emailConsent: $("email-consent").checked, emailCoversNotice: $("email-covers").checked });
  $("expiry").setAttribute("aria-invalid", String(out.field === "expiry"));
  $("rent").setAttribute("aria-invalid", String(out.field === "rent"));
  render(out);
}
function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type: type }));
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const examples = {
  ordinary: { date: "2026-11-19", kind: "monthly", due: "1", delivery: "hand", rent: "1850" },
  mail: { date: "2026-11-28", kind: "monthly", due: "1", delivery: "mail", rent: "1850" },
  courier: { date: "2026-12-31", kind: "monthly", due: "1", delivery: "courier", rent: "2100" },
  winter: { date: "2027-01-01", kind: "monthly", due: "1", delivery: "hand" },
  late: { date: "2026-11-19", kind: "fixed", due: "1", expiry: "2026-12-31", delivery: "hand" }
};
$("calculator").addEventListener("submit", (e) => { e.preventDefault(); run(); });
$("kind").addEventListener("change", () => { toggleRows(); run(); });
for (const el of document.querySelectorAll('input[name="delivery"]')) el.addEventListener("change", () => { toggleRows(); run(); });
for (const id of ["notice", "due", "expiry", "payday", "rent", "email-consent", "email-covers"]) $(id).addEventListener("change", run);
for (const id of ["landlord", "tenant", "unit"]) $(id).addEventListener("input", () => { $("draft").textContent = draftText(current); });
for (const el of document.querySelectorAll("[data-example]")) el.addEventListener("click", () => {
  const x = examples[el.dataset.example];
  $("notice").value = x.date; $("kind").value = x.kind; $("due").value = x.due; $("expiry").value = x.expiry || ""; $("rent").value = x.rent || "";
  document.querySelector('input[name="delivery"][value="' + x.delivery + '"]').checked = true;
  toggleRows(); run();
  document.querySelectorAll("[data-example]").forEach((b) => b.setAttribute("aria-pressed", String(b === el)));
});
$("calendar").addEventListener("click", () => {
  if (!current || !current.valid) return;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  download("lease-exit-reminder.ics", L.reminderICS(current, stamp), "text/calendar;charset=utf-8");
});
$("print").addEventListener("click", () => window.print());
$("copy-draft").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("draft").textContent || ""); $("copy-status").textContent = "Courtesy note copied. Remember to complete official Form N9."; }
  catch (e) { $("copy-status").textContent = "Copy is unavailable here. Select the note and copy it yourself."; }
});
async function init() {
  $("notice").value = todayISO();
  $("expiry").value = "2026-12-31";
  toggleRows(); run();
  try {
    const res = await fetch("data/rules.json");
    if (!res.ok) throw new Error("source file");
    const r = await res.json();
    $("rules-copy").innerHTML = '<ul class="clean">' + r.ordinary_rules.map((v) => '<li><strong>' + v.label + '.</strong> ' + v.summary + '</li>').join("") + '<li><strong>February and March.</strong> ' + r.february_march_rule.summary + (r.february_march_rule.statute_text ? ' <span id="s44-5-text">The text of s. 44 (5), word for word: "' + r.february_march_rule.statute_text + '" ' + r.february_march_rule.scope + ' ' + r.february_march_rule.deeming_note + '</span>' : '') + '</li></ul><p>' + r.counting_rule + '</p>';
    if (r.service_chain) $("chain-copy").innerHTML = '<p>' + r.service_chain.summary + '</p><ol>' + r.service_chain.links.map((l) => '<li><strong>' + l.from + '</strong>: ' + l.text + '</li>').join("") + '</ol><p><strong>The reading this page relies on.</strong></p><ul>' + r.service_chain.assumptions.map((t) => '<li>' + t + '</li>').join("") + '</ul>';
    $("exceptions-copy").innerHTML = '<ul>' + r.exceptions_not_calculated.map((s) => '<li>' + s + '</li>').join("") + '</ul>';
    $("source-list").innerHTML = r.sources.map((s) => '<li><a href="' + s.url + '">' + s.name + '</a><p>' + s.note + '</p></li>').join("");
  } catch (e) {
    $("rules-copy").textContent = "The source list could not load. Open official Form N9 above to read the notice rules before using this result.";
    $("source-list").innerHTML = '<li><a href="https://tribunalsontario.ca/ltb/">Tribunals Ontario, Landlord and Tenant Board</a></li>';
  }
}
init();
