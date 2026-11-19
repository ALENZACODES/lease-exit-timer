// Lease Exit Timer date engine. Pure functions, no DOM, so the same file runs in the browser and in Node tests.
// Rules: Residential Tenancies Act, 2006, ss. 38, 44, 47 and 191 (3); Legislation Act, 2006, ss. 87, 88 and 89 (3);
// Landlord and Tenant Board Rules of Procedure, rules 1.1, 3.1, 3.5 and 3.9; official Form N9 instructions.
(function (root) {
  "use strict";
  const DAY = 86400000;
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function pad(n) { return String(n).padStart(2, "0"); }
  function make(y, m, d) { return { y: y, m: m, d: d }; }
  function toISO(dt) { return dt.y + "-" + pad(dt.m) + "-" + pad(dt.d); }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function isValid(dt) {
    return Number.isInteger(dt.y) && Number.isInteger(dt.m) && Number.isInteger(dt.d) &&
      dt.y >= 1900 && dt.y <= 2200 && dt.m >= 1 && dt.m <= 12 && dt.d >= 1 && dt.d <= daysInMonth(dt.y, dt.m);
  }
  function parseISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim());
    if (!m) return null;
    const dt = make(Number(m[1]), Number(m[2]), Number(m[3]));
    return isValid(dt) ? dt : null;
  }
  function toUTC(dt) { return Date.UTC(dt.y, dt.m - 1, dt.d); }
  function fromUTC(ms) {
    const x = new Date(ms);
    return make(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate());
  }
  function addDays(dt, n) { return fromUTC(toUTC(dt) + n * DAY); }
  function weekday(dt) { return new Date(toUTC(dt)).getUTCDay(); }
  function lastDayOfMonth(y, m) { return make(y, m, daysInMonth(y, m)); }
  function isLastDayOfFebruary(dt) { return dt.m === 2 && dt.d === daysInMonth(dt.y, 2); }
  function isLastDayOfMarch(dt) { return dt.m === 3 && dt.d === daysInMonth(dt.y, 3); }
  function cmp(a, b) { return toUTC(a) - toUTC(b); }
  function lte(a, b) { return cmp(a, b) <= 0; }
  function gte(a, b) { return cmp(a, b) >= 0; }
  // Legislation Act, 2006, s. 89 (3): exclude the first day, include the last, even for "at least".
  function daysBetween(a, b) { return Math.round((toUTC(b) - toUTC(a)) / DAY); }
  function nextMonth(y, m) { return m === 12 ? [y + 1, 1] : [y, m + 1]; }

  // Monthly tenancy with rent due on dueDay. When a month has no such day (for example the 31st in
  // April), rent falls due on that month's last day. A rental period ends the day before rent is due.
  function dueDateIn(y, m, dueDay) { return make(y, m, Math.min(dueDay, daysInMonth(y, m))); }
  function periodEndOnOrAfter(minDate, dueDay) {
    let y = minDate.y, m = minDate.m;
    for (let i = 0; i < 3; i++) {
      const end = addDays(dueDateIn(y, m, dueDay), -1);
      if (gte(end, minDate)) return end;
      [y, m] = nextMonth(y, m);
    }
    return addDays(dueDateIn(y, m, dueDay), -1);
  }
  function nextPeriodEndAfter(current, dueDay) { return periodEndOnOrAfter(addDays(current, 1), dueDay); }
  // Rental months from date a to a later monthly period end b: the number of period ends after a, up to and including b.
  function monthsBetween(a, b, dueDay) {
    let c = a, n = 0;
    while (cmp(c, b) < 0 && n < 240) { c = nextPeriodEndAfter(c, dueDay); n++; }
    return n;
  }
  function nextWeekdayOnOrAfter(minDate, wd) { return addDays(minDate, (wd - weekday(minDate) + 7) % 7); }

  // s. 44 (5): applies to monthly, yearly and fixed-term notices, never to daily or weekly ones.
  function specialAllows(notice, term, kind) {
    if (kind === "weekly" || kind === "daily") return false;
    if (isLastDayOfFebruary(term)) return lte(notice, make(term.y, 1, 1));
    if (isLastDayOfMarch(term)) return lte(notice, make(term.y, 2, 1));
    return false;
  }
  function minDaysFor(kind) { return kind === "weekly" || kind === "daily" ? 28 : 60; }

  // Latest day notice can be given (served) for a termination date.
  function lastOrdinaryNoticeDay(term, minDays, kind) {
    const ordinary = addDays(term, -minDays);
    if (kind !== "weekly" && kind !== "daily") {
      if (isLastDayOfFebruary(term)) { const j = make(term.y, 1, 1); return gte(j, ordinary) ? j : ordinary; }
      if (isLastDayOfMarch(term)) { const f = make(term.y, 2, 1); return gte(f, ordinary) ? f : ordinary; }
    }
    return ordinary;
  }
  function isTermValid(notice, term, minDays, kind) {
    if (daysBetween(notice, term) >= minDays) return { ok: true, usedSpecial: false };
    if (specialAllows(notice, term, kind)) return { ok: true, usedSpecial: true };
    return { ok: false, usedSpecial: false };
  }

  function earliestMonthly(notice, dueDay, minDays) {
    let cursor = periodEndOnOrAfter(addDays(notice, 1), dueDay);
    for (let i = 0; i < 6; i++) {
      const check = isTermValid(notice, cursor, minDays, "monthly");
      if (check.ok) return { t: cursor, special: check.usedSpecial };
      cursor = nextPeriodEndAfter(cursor, dueDay);
    }
    throw new Error("no monthly period end found");
  }
  function earliestWeekly(notice, payWeekday, minDays) {
    const endWeekday = (payWeekday + 6) % 7;
    return { t: nextWeekdayOnOrAfter(addDays(notice, minDays), endWeekday), special: false, endWeekday: endWeekday };
  }
  function earliestDaily(notice, minDays) { return { t: addDays(notice, minDays), special: false }; }

  // Holidays. LTB Rules of Procedure, rule 1.1: "holiday" means any Saturday, Sunday or other day on which
  // the LTB's offices are closed. The Legislation Act, 2006, s. 88 lists Ontario's statutory holidays.
  // Civic Holiday is not on the s. 88 list; it is added here on purpose, because counting one extra
  // holiday can only move a courier date later and the advised send day earlier, never the other way.
  function nthWeekday(y, m, wd, n) { // n-th weekday wd (0 = Sunday) of month m
    const first = make(y, m, 1);
    return addDays(first, (wd - weekday(first) + 7) % 7 + 7 * (n - 1));
  }
  function easterSunday(y) { // Anonymous Gregorian algorithm
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451), month = Math.floor((h + l - 7 * m + 114) / 31);
    return make(y, month, ((h + l - 7 * m + 114) % 31) + 1);
  }
  const holidayCache = {};
  function holidaysIn(y) {
    if (holidayCache[y]) return holidayCache[y];
    const list = [];
    // kind "statutory": listed in the Legislation Act, 2006, s. 88. kind "assumed": not a statutory holiday,
    // treated as a possible Board office closure to be safe. The two are kept apart so the page can say which is which.
    const add = (dt, name, source, kind) => list.push({ date: toISO(dt), name: name, source: source, kind: kind || "statutory" });
    const S88 = "Legislation Act, 2006, s. 88 (2)";
    const jan1 = make(y, 1, 1);
    add(jan1, "New Year's Day", S88);
    if (weekday(jan1) === 0) add(make(y, 1, 2), "Day after New Year's Day", "Legislation Act, 2006, s. 88 (3)");
    add(nthWeekday(y, 2, 1, 3), "Family Day", S88);
    const easter = easterSunday(y);
    add(addDays(easter, -2), "Good Friday", S88);
    add(addDays(easter, 1), "Easter Monday", S88);
    add(addDays(make(y, 5, 25), -(((weekday(make(y, 5, 25)) + 6) % 7) || 7)), "Victoria Day", S88);
    add(weekday(make(y, 7, 1)) === 0 ? make(y, 7, 2) : make(y, 7, 1), "Canada Day", weekday(make(y, 7, 1)) === 0 ? "Legislation Act, 2006, s. 88 (4)" : S88);
    add(nthWeekday(y, 8, 1, 1), "Civic Holiday", "Not a statutory holiday; treated as a possible Board office closure, to be safe", "assumed");
    add(nthWeekday(y, 9, 1, 1), "Labour Day", S88);
    add(nthWeekday(y, 10, 1, 2), "Thanksgiving Day", S88);
    add(make(y, 11, 11), "Remembrance Day", S88);
    const xmas = make(y, 12, 25);
    add(xmas, "Christmas Day", S88);
    add(make(y, 12, 26), "Boxing Day", S88);
    if (weekday(xmas) === 6) add(make(y, 12, 27), "Monday after Christmas Day", "Legislation Act, 2006, s. 88 (5)");
    if (weekday(xmas) === 0) add(make(y, 12, 27), "Tuesday after Christmas Day", "Legislation Act, 2006, s. 88 (5)");
    list.sort((p, q) => (p.date < q.date ? -1 : 1));
    holidayCache[y] = list;
    return list;
  }
  function holidayOn(dt) { const iso = toISO(dt); return holidaysIn(dt.y).find((h) => h.date === iso) || null; }
  function isWeekend(dt) { const w = weekday(dt); return w === 0 || w === 6; }
  // opts.assumed === false leaves out assumed closures (Civic Holiday) and counts statutory holidays only.
  function isCourierHoliday(dt, opts) {
    if (isWeekend(dt)) return true;
    const h = holidayOn(dt);
    if (!h) return false;
    return h.kind === "statutory" || !(opts && opts.assumed === false);
  }

  // How the notice reaches the landlord, and the day it counts as given.
  const DELIVERY = {
    hand: { label: "By hand, or left in the landlord's mail box", lag: "same day" },
    email: { label: "By email, only if the landlord's written consent covers this notice", lag: "same day" },
    courier: { label: "By courier", lag: "next day that is not a holiday" },
    mail: { label: "By mail (Canada Post)", lag: "fifth day" }
  };
  function deemedGiven(sent, method, opts) {
    if (method === "mail") return addDays(sent, 5); // RTA s. 191 (3)
    if (method === "courier") { // LTB Rules 3.9: day after, or if that is a holiday the next day that is not
      let d = addDays(sent, 1);
      while (isCourierHoliday(d, opts)) d = addDays(d, 1);
      return d;
    }
    return sent; // hand, mail box, email: the day it is given or sent
  }
  // Days a courier date was moved past, so the page can say why.
  function courierSkipped(sent, opts) {
    const out = [];
    for (let d = addDays(sent, 1); isCourierHoliday(d, opts); d = addDays(d, 1)) {
      const h = holidayOn(d);
      out.push({ date: toISO(d), name: h ? h.name : (weekday(d) === 6 ? "Saturday" : "Sunday"), source: h ? h.source : "LTB Rules, rule 1.1", kind: h ? h.kind : "weekend" });
    }
    return out;
  }
  function latestSendFor(deadline, method) {
    // Walk back from the deadline to the last send day whose deemed day is still on time.
    let d = deadline;
    for (let i = 0; i < 15; i++) {
      if (lte(deemedGiven(d, method), deadline)) return d;
      d = addDays(d, -1);
    }
    return d;
  }

  function compute(input) {
    const sent = parseISO(input.noticeDate);
    if (!sent) return { error: "Enter a valid date in the first box." };
    const kind = input.kind || "monthly";
    if (!["monthly", "fixed", "weekly", "daily"].includes(kind)) return { error: "Choose a kind of tenancy." };
    const method = DELIVERY[input.delivery] ? input.delivery : "hand";
    if (method === "email" && !(input.emailConsent === true && input.emailCoversNotice === true)) {
      return { error: "Email counts only with the landlord's written consent to service by email (LTB rule 3.5), and that consent has to cover a tenant's notice to end the tenancy. Tick both boxes only if that is true, or choose another delivery method.", needsEmailConsent: true };
    }
    const rentText = String(input.rent == null ? "" : input.rent).replace(/[$,\s]/g, "");
    let rent = null;
    if (rentText !== "") {
      rent = Number(rentText);
      if (!Number.isFinite(rent) || rent <= 0 || rent > 100000) return { error: "Rent should be a number such as 1850, or leave the rent box empty. It is optional.", field: "rent" };
    }
    const notice = deemedGiven(sent, method, input.statutoryOnly ? { assumed: false } : undefined);
    const minDays = minDaysFor(kind);
    const out = { sent: toISO(sent), notice: toISO(notice), delivery: method, kind: kind, minDays: minDays, notes: [] };
    if (method === "courier") out.courierSkipped = courierSkipped(sent, input.statutoryOnly ? { assumed: false } : undefined);

    function finish(term, special) {
      out.termination = toISO(term);
      const last = lastOrdinaryNoticeDay(term, minDays, kind);
      out.lastNoticeDay = toISO(last);
      out.lastSendDay = toISO(latestSendFor(last, method));
      out.daysOfNotice = daysBetween(notice, term);
      out.usedSpecial = special;
      // Mail and courier need a pickup or a post office. When the last send day is a weekend or a statutory
      // holiday, say so and give the last ordinary working day before it.
      const ls = parseISO(out.lastSendDay);
      if ((method === "mail" || method === "courier") && isCourierHoliday(ls, { assumed: false })) {
        let w = ls; while (isCourierHoliday(w)) w = addDays(w, -1);
        out.lastWorkingSendDay = toISO(w);
        const h = holidayOn(ls);
        out.sendDayNote = "That last day is a " + (h && h.kind === "statutory" ? h.name : (weekday(ls) === 6 ? "Saturday" : "Sunday")) + ". Many post offices and couriers are closed or do not pick up then, so plan to send it by " + WEEKDAYS[weekday(w)] + ", " + MONTHS[w.m - 1] + " " + w.d + ", " + w.y + ".";
      }
      return out;
    }
    // Extras that need a finished result: what one late day costs, and whether an assumed closure moved the date.
    function extras() {
      if (input.noExtras) return out;
      const base = Object.assign({}, input, { rent: "", noExtras: true });
      if (method === "courier") {
        const plain = deemedGiven(sent, method, { assumed: false });
        if (cmp(plain, notice) !== 0) {
          const alt = compute(Object.assign({}, base, { statutoryOnly: true }));
          out.assumedClosure = { notice: toISO(plain), termination: alt.termination, valid: alt.valid, changesEnd: alt.termination !== out.termination || alt.valid !== out.valid };
        }
      }
      if (rent !== null && out.valid) {
        const lateDay = toISO(addDays(parseISO(out.lastSendDay), 1));
        const late = compute(Object.assign({}, base, { noticeDate: lateDay }));
        let lateEnd = null;
        if (!late.error && late.valid && late.termination !== out.termination) lateEnd = late.termination;
        else if (!late.error && !late.valid && late.fallback) lateEnd = late.fallback.termination;
        if (lateEnd) {
          const a = parseISO(out.termination), b = parseISO(lateEnd);
          let periods, unit;
          if (kind === "weekly") { periods = daysBetween(a, b) / 7; unit = "week"; }
          else if (kind === "daily") { periods = daysBetween(a, b); unit = "day"; }
          else { periods = monthsBetween(a, b, Number(input.dueDay)); unit = "month"; }
          out.lateCost = { sendDay: lateDay, termination: lateEnd, periods: periods, unit: unit, rent: rent, amount: Math.round(rent * periods * 100) / 100, viaFallback: kind === "fixed" };
        }
      }
      return out;
    }

    if (kind === "fixed") {
      if (!String(input.expiryDate || "").trim()) return { error: "Enter the last day of the fixed term. It is the end date written in your lease, for example August 31, 2027 for a one year lease that began on September 1, 2026.", field: "expiry" };
      const expiry = parseISO(input.expiryDate);
      if (!expiry) return { error: "The fixed term end date is not a real calendar date. Check the day and month.", field: "expiry" };
      if (cmp(expiry, notice) <= 0) return { error: "The fixed term has already ended on the day this notice would count. After a fixed term ends the tenancy usually continues month to month (s. 38 (1)), so choose Monthly.", field: "expiry" };
      if (daysBetween(notice, expiry) > 3660) return { error: "That fixed term ends more than ten years after the notice. Check the year in the end date.", field: "expiry" };
      const dueForCheck = Number(input.dueDay);
      if (Number.isInteger(dueForCheck) && dueForCheck >= 1 && dueForCheck <= 31) {
        const nextDue = addDays(expiry, 1);
        if (nextDue.d !== Math.min(dueForCheck, daysInMonth(nextDue.y, nextDue.m))) {
          out.notes.push("This end date is not the day before your rent day. Most leases end the day before rent would next be due. Check the end date written in your lease before you use it on Form N9.");
        }
      }
      const check = isTermValid(notice, expiry, minDays, "fixed");
      finish(expiry, check.usedSpecial);
      out.valid = check.ok;
      if (!check.ok) {
        out.message = "This notice is too late to end the tenancy on the last day of the fixed term.";
        // s. 38 (1): an expired fixed term with no notice is deemed renewed as a monthly tenancy.
        const due = Number(input.dueDay);
        if (Number.isInteger(due) && due >= 1 && due <= 31) {
          const next = earliestMonthly(notice, due, 60);
          out.fallback = { termination: toISO(next.t), usedSpecial: next.special, daysOfNotice: daysBetween(notice, next.t) };
        }
      } else if (check.usedSpecial) {
        out.message = "This date uses the February and March rule in section 44 (5), so less than 60 days counts as enough.";
      } else {
        out.message = "A fixed term ends on its expiry date. You need at least 60 days' notice before that date.";
      }
      return extras();
    }
    if (kind === "daily") {
      const e = earliestDaily(notice, minDays);
      finish(e.t, false); out.valid = true;
      out.message = "A daily tenancy needs at least 28 days' notice, ending on the last day of a rental period.";
      return extras();
    }
    if (kind === "weekly") {
      const pay = Number(input.payWeekday);
      if (!Number.isInteger(pay) || pay < 0 || pay > 6) return { error: "Choose the weekday rent is paid." };
      const e = earliestWeekly(notice, pay, minDays);
      finish(e.t, false); out.valid = true; out.periodEndWeekday = e.endWeekday;
      out.message = "A weekly tenancy needs at least 28 days' notice, ending on the last day of a rental week.";
      return extras();
    }
    const due = Number(input.dueDay);
    if (!Number.isInteger(due) || due < 1 || due > 31) return { error: "Enter the day of the month rent is due, from 1 to 31." };
    const e = earliestMonthly(notice, due, minDays);
    finish(e.t, e.special); out.valid = true;
    out.message = e.special
      ? "This date uses the February and March rule in section 44 (5), so less than 60 days counts as enough."
      : "A monthly tenancy needs at least 60 days' notice, ending on the last day of a rental period.";
    return extras();
  }

  // Form N9 (v. 01/04/2022): every field the tenant or representative must complete, in the order they appear
  // on the form, with the computed date filled in. The Office Use Only box on page 3 is for the Board and is left out.
  function n9Date(iso) { const d = parseISO(iso); return d ? pad(d.d) + "/" + pad(d.m) + "/" + d.y : ""; }
  function n9Checklist(out) {
    if (!out || !out.valid) return [];
    return [
      { page: 1, field: "To: (Landlord's name)", fill: "Your landlord's name as it appears on the lease" },
      { page: 1, field: "From: (Tenant's name)", fill: "Include all tenant names" },
      { page: 1, field: "Address of the Rental Unit", fill: "Full address, including the unit number" },
      { page: 1, field: "The last day of my tenancy will be (dd/mm/yyyy)", fill: n9Date(out.termination) },
      { page: 3, field: "Signature: Tenant or Representative", fill: "Tick the box that applies" },
      { page: 3, field: "First Name, Last Name, Phone Number", fill: "The person signing" },
      { page: 3, field: "Signature and Date (dd/mm/yyyy)", fill: "Sign and date the form" },
      { page: 0, field: (out.delivery === "hand" ? "Give" : "Send") + " it by", fill: n9Date(out.lastSendDay) + " (" + DELIVERY[out.delivery].label + ")" }
    ];
  }

  // A small calendar file so the last send day lands in the renter's own calendar.
  function reminderICS(out, stamp) {
    if (!out || !out.valid) return "";
    const d = out.lastSendDay.replace(/-/g, "");
    const end = toISO(addDays(parseISO(out.lastSendDay), 1)).replace(/-/g, "");
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//John Khan//Lease Exit Timer//EN", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:lease-exit-" + d + "-" + out.termination.replace(/-/g, "") + "@lease-exit-timer",
      "DTSTAMP:" + (stamp || "20260101T000000Z"),
      "DTSTART;VALUE=DATE:" + d,
      "DTEND;VALUE=DATE:" + end,
      "SUMMARY:Last day to give Form N9 for " + out.termination,
      "DESCRIPTION:Give official Form N9 by this day so the tenancy can end on " + out.termination + ".",
      "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", "DESCRIPTION:Form N9 is due in 7 days", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ];
    return lines.join("\r\n") + "\r\n";
  }

  const api = {
    pad, make, toISO, parseISO, addDays, weekday, lastDayOfMonth, daysInMonth, daysBetween,
    isLastDayOfFebruary, isLastDayOfMarch, periodEndOnOrAfter, lastOrdinaryNoticeDay, isTermValid,
    earliestMonthly, earliestWeekly, earliestDaily, deemedGiven, latestSendFor, DELIVERY, compute, reminderICS, cmp,
    holidaysIn, holidayOn, isCourierHoliday, courierSkipped, easterSunday, n9Checklist, n9Date, monthsBetween
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LeaseDates = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
