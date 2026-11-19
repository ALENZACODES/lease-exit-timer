// Lease Exit Timer date engine. Pure functions, no DOM, so the same file runs in the browser and in Node tests.
// Rules: Residential Tenancies Act, 2006, ss. 38, 44, 47 and 191 (3); Legislation Act, 2006, s. 89 (3);
// Landlord and Tenant Board Rules of Procedure, rules 3.1 and 3.9; official Form N9 instructions.
(function (root) {
  "use strict";
  const DAY = 86400000;

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

  // How the notice reaches the landlord, and the day it counts as given.
  const DELIVERY = {
    hand: { label: "By hand, or left in the landlord's mail box", lag: "same day" },
    email: { label: "By email, only if the landlord agreed in writing to email", lag: "same day" },
    courier: { label: "By courier", lag: "next day" },
    mail: { label: "By mail (Canada Post)", lag: "fifth day" }
  };
  function isWeekend(dt) { const w = weekday(dt); return w === 0 || w === 6; }
  function deemedGiven(sent, method) {
    if (method === "mail") return addDays(sent, 5); // RTA s. 191 (3)
    if (method === "courier") { // LTB Rules 3.9: day after, or the next day that is not a holiday
      let d = addDays(sent, 1);
      while (isWeekend(d)) d = addDays(d, 1);
      return d;
    }
    return sent; // hand, mail box, email: the day it is given or sent
  }
  function latestSendFor(deadline, method) {
    // Walk back from the deadline to the last send day whose deemed day is still on time.
    let d = deadline;
    for (let i = 0; i < 10; i++) {
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
    const notice = deemedGiven(sent, method);
    const minDays = minDaysFor(kind);
    const out = { sent: toISO(sent), notice: toISO(notice), delivery: method, kind: kind, minDays: minDays };

    function finish(term, special) {
      out.termination = toISO(term);
      const last = lastOrdinaryNoticeDay(term, minDays, kind);
      out.lastNoticeDay = toISO(last);
      out.lastSendDay = toISO(latestSendFor(last, method));
      out.daysOfNotice = daysBetween(notice, term);
      out.usedSpecial = special;
      return out;
    }

    if (kind === "fixed") {
      const expiry = parseISO(input.expiryDate);
      if (!expiry) return { error: "Enter the last day of the fixed term." };
      if (cmp(expiry, notice) <= 0) return { error: "The fixed term has already ended on that date. After a fixed term ends the tenancy usually continues month to month, so choose Monthly." };
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
      return out;
    }
    if (kind === "daily") {
      const e = earliestDaily(notice, minDays);
      finish(e.t, false); out.valid = true;
      out.message = "A daily tenancy needs at least 28 days' notice, ending on the last day of a rental period.";
      return out;
    }
    if (kind === "weekly") {
      const pay = Number(input.payWeekday);
      if (!Number.isInteger(pay) || pay < 0 || pay > 6) return { error: "Choose the weekday rent is paid." };
      const e = earliestWeekly(notice, pay, minDays);
      finish(e.t, false); out.valid = true; out.periodEndWeekday = e.endWeekday;
      out.message = "A weekly tenancy needs at least 28 days' notice, ending on the last day of a rental week.";
      return out;
    }
    const due = Number(input.dueDay);
    if (!Number.isInteger(due) || due < 1 || due > 31) return { error: "Enter the day of the month rent is due, from 1 to 31." };
    const e = earliestMonthly(notice, due, minDays);
    finish(e.t, e.special); out.valid = true;
    out.message = e.special
      ? "This date uses the February and March rule in section 44 (5), so less than 60 days counts as enough."
      : "A monthly tenancy needs at least 60 days' notice, ending on the last day of a rental period.";
    return out;
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
    earliestMonthly, earliestWeekly, earliestDaily, deemedGiven, latestSendFor, DELIVERY, compute, reminderICS, cmp
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LeaseDates = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
