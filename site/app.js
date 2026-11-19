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
    mail: "The date that counts is the fifth day after mailing, not the day you put it in the post.",
    courier: "Rule 3.9 counts the day after hand off, or the next day that is not a holiday. Weekends and assumed Board office closures are counted here.",
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
  if (wk.length) parts.push('Saturday or Sunday, a holiday under LTB rule 1.1 by name: ' + wk.join(", ") + '.');
  if (st.length) parts.push('Ontario holiday under the Legislation Act, 2006, s. 88, assumed to be a Board office closure: ' + st.join(", ") + '.');
  if (as.length) parts.push('Not on the s. 88 list, also assumed to be a Board office closure: ' + as.join(", ") + '.');
  let html = '<div class="source-note" id="courier-skipped"><p><strong>Courier date moved past these days (LTB rule 3.9).</strong></p><ul>' + parts.map((t) => '<li>' + t + '</li>').join("") + '</ul>';
  if (st.length || as.length) html += '<p>Rule 1.1 counts a weekday as a holiday only if the Board\'s offices are closed that day. This page has not checked a Board closure calendar, so each weekday closure is an assumption. An extra closed day can only make the advised day earlier.</p>';
  const o = out.officeOpen;
  if (o) {
    html += o.changesEnd
      ? '<p>If the Board\'s offices are open on ' + o.days.join(" and ") + ', the notice would count on ' + pretty(o.notice) + ' and an earlier end date of ' + pretty(o.termination) + ' could be available. This page shows the later date, because it does not depend on that guess. Sending one day earlier avoids the question.</p>'
      : '<p>Even if the Board\'s offices are open on ' + o.days.join(" and ") + ', the end date is the same. The notice would count on ' + pretty(o.notice) + '.</p>';
  }
  return html + '</div>';
}
function methodsNote(out) {
  if (!out.byMethod) return "";
  const name = { hand: "By hand or mail box", mail: "Canada Post", courier: "Courier", email: "Email, with written consent" };
  return '<p class="note" id="by-method"><strong>Same end date, every method.</strong> To end on ' + pretty(out.termination) + ', the last day to send is: ' +
    out.byMethod.map((x) => (x.method === out.delivery ? '<strong>' : '') + name[x.method] + ' ' + pretty(x.lastSendDay) + (x.method === out.delivery ? '</strong>' : '')).join("; ") + '.</p>';
}
function lateNote(out) {
  const c = out.lateCost;
  const unit = c.periods === 1 ? c.unit : c.unit + "s";
  return '<p class="note" id="late-cost"><strong>One day late could mean about ' + money(c.amount) + ' more rent.</strong> ' + (out.delivery === "hand" ? "Giving" : "Sending") + ' it on ' + pretty(c.sendDay) + ' instead would make the earliest end date ' + pretty(c.termination) + (c.viaFallback ? ' as a monthly tenancy after the fixed term' : '') + ', ' + c.periods + ' more ' + unit + ' at ' + money(c.rent) + '. This is an estimate from the rent you typed, not a bill. What you actually owe depends on your tenancy, for example if you and your landlord agree in writing to end it on another date.</p>';
}
function render(out) {
  current = out;
  $("copy-status").textContent = "";
  $("actions").hidden = !out.valid;
  if (out.error) {
    $("result").innerHTML = '<div class="error"><strong>Check one detail.</strong><p>' + out.error + '</p></div>';
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
  let html = late
    ? '<p class="flag">TOO LATE FOR THIS FIXED TERM</p><h3 class="date late">' + pretty(out.termination) + '</h3>'
    : '<p class="flag">' + label + '</p><h3 class="date">' + pretty(out.termination) + '</h3>';
  html += '<p>' + out.message + '</p>';
  (out.notes || []).forEach((n) => { html += '<p class="note">' + n + '</p>'; });
  if (!late) {
    html += '<div class="deadline"><span>LAST DAY TO ' + (out.delivery === "hand" ? "GIVE" : "SEND") + ' IT THIS WAY</span><strong>' + pretty(out.lastSendDay) + '</strong><small>For notice that counts by ' + pretty(out.lastNoticeDay) + '</small></div>';
    html += '<ol class="timeline">' + steps.map((s) => '<li><span>' + s[0] + '</span><strong>' + s[1] + '</strong></li>').join("") + '</ol>';
    if (out.valid) html += methodsNote(out);
    if (out.delivery === "courier" && out.courierSkipped && out.courierSkipped.length) html += courierNote(out);
    if (out.lateCost) html += lateNote(out);
    if (out.sendDayNote) html += '<p class="note" id="send-day-note">' + out.sendDayNote + '</p>';
    if (out.delivery === "email") html += '<p class="note">Put your name and phone number in the email, attach the signed Form N9, and keep a copy of the sent email and of the written consent.</p>';
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
    $("rules-copy").innerHTML = '<ul class="clean">' + r.ordinary_rules.map((v) => '<li><strong>' + v.label + '.</strong> ' + v.summary + '</li>').join("") + '<li><strong>February and March.</strong> ' + r.february_march_rule.summary + '</li></ul><p>' + r.counting_rule + '</p>';
    if (r.service_chain) $("chain-copy").innerHTML = '<p>' + r.service_chain.summary + '</p><ol>' + r.service_chain.links.map((l) => '<li><strong>' + l.from + '</strong>: ' + l.text + '</li>').join("") + '</ol><p><strong>The reading this page relies on.</strong></p><ul>' + r.service_chain.assumptions.map((t) => '<li>' + t + '</li>').join("") + '</ul>';
    $("exceptions-copy").innerHTML = '<ul>' + r.exceptions_not_calculated.map((s) => '<li>' + s + '</li>').join("") + '</ul>';
    $("source-list").innerHTML = r.sources.map((s) => '<li><a href="' + s.url + '">' + s.name + '</a><p>' + s.note + '</p></li>').join("");
  } catch (e) {
    $("rules-copy").textContent = "The source list could not load. Open official Form N9 above to read the notice rules before using this result.";
    $("source-list").innerHTML = '<li><a href="https://tribunalsontario.ca/ltb/">Tribunals Ontario, Landlord and Tenant Board</a></li>';
  }
}
init();
