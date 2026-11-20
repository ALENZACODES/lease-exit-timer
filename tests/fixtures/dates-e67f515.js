(function (root) {
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function make(y, m, d) {
    return { y: y, m: m, d: d };
  }
  function toISO(dt) {
    return dt.y + "-" + pad(dt.m) + "-" + pad(dt.d);
  }
  function parseISO(s) {
    const p = String(s).split("-").map(Number);
    if (p.length !== 3 || p.some((n) => !Number.isFinite(n))) return null;
    const dt = make(p[0], p[1], p[2]);
    if (!isValid(dt)) return null;
    return dt;
  }
  function toUTC(dt) {
    return Date.UTC(dt.y, dt.m - 1, dt.d);
  }
  function fromUTC(ms) {
    const x = new Date(ms);
    return make(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate());
  }
  function daysInMonth(y, m) {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
  }
  function isValid(dt) {
    if (dt.m < 1 || dt.m > 12 || dt.d < 1) return false;
    return dt.d <= daysInMonth(dt.y, dt.m);
  }
  function addDays(dt, n) {
    return fromUTC(toUTC(dt) + n * 86400000);
  }
  function weekday(dt) {
    return new Date(toUTC(dt)).getUTCDay();
  }
  function lastDayOfMonth(y, m) {
    return make(y, m, daysInMonth(y, m));
  }
  function isLastDayOfFebruary(dt) {
    return dt.m === 2 && dt.d === daysInMonth(dt.y, 2);
  }
  function isLastDayOfMarch(dt) {
    return dt.m === 3 && dt.d === daysInMonth(dt.y, 3);
  }
  function cmp(a, b) {
    return toUTC(a) - toUTC(b);
  }
  function lte(a, b) {
    return cmp(a, b) <= 0;
  }
  function gte(a, b) {
    return cmp(a, b) >= 0;
  }

  // Rent due on dueDay (1-31). Period end is the day before, wrapping the prior month.
  function periodEndOnOrAfter(minDate, dueDay) {
    if (dueDay === 1) {
      let t = lastDayOfMonth(minDate.y, minDate.m);
      if (cmp(t, minDate) < 0) {
        const y = minDate.m === 12 ? minDate.y + 1 : minDate.y;
        const m = minDate.m === 12 ? 1 : minDate.m + 1;
        t = lastDayOfMonth(y, m);
      }
      return t;
    }
    // period ends on dueDay-1, or last day of previous month if that day does not exist
    function endInMonth(y, m) {
      // period that ends just before due day in month m+? 
      // If rent is due on the 15th of month M, period ends on the 14th of month M.
      const d = Math.min(dueDay - 1, daysInMonth(y, m));
      return make(y, m, d);
    }
    let t = endInMonth(minDate.y, minDate.m);
    if (cmp(t, minDate) < 0) {
      const y = minDate.m === 12 ? minDate.y + 1 : minDate.y;
      const m = minDate.m === 12 ? 1 : minDate.m + 1;
      t = endInMonth(y, m);
    }
    return t;
  }

  function nextPeriodEndAfter(current, dueDay) {
    const next = addDays(current, 1);
    return periodEndOnOrAfter(next, dueDay);
  }

  function nextWeekdayOnOrAfter(minDate, endWeekday) {
    const w = weekday(minDate);
    const add = (endWeekday - w + 7) % 7;
    return addDays(minDate, add);
  }

  function specialAllows(notice, term, kind) {
    if (kind === "weekly" || kind === "daily") return false;
    if (isLastDayOfFebruary(term)) {
      return lte(notice, make(term.y, 1, 1));
    }
    if (isLastDayOfMarch(term)) {
      return lte(notice, make(term.y, 2, 1));
    }
    return false;
  }

  function lastOrdinaryNoticeDay(term, minDays, kind) {
    let last = addDays(term, -minDays);
    if (kind !== "weekly" && kind !== "daily") {
      if (isLastDayOfFebruary(term)) last = make(term.y, 1, 1);
      else if (isLastDayOfMarch(term)) last = make(term.y, 2, 1);
    }
    return last;
  }

  function isTermValid(notice, term, minDays, kind) {
    const ordinary = gte(term, addDays(notice, minDays));
    const special = specialAllows(notice, term, kind);
    if (ordinary) return { ok: true, usedSpecial: false };
    if (special) return { ok: true, usedSpecial: true };
    return { ok: false, usedSpecial: false };
  }

  function earliestMonthly(notice, dueDay, minDays) {
    const minTerm = addDays(notice, minDays);
    let t = periodEndOnOrAfter(minTerm, dueDay);
    // A February or March period end might be valid under the special rule even if it is before minTerm.
    if (dueDay === 1) {
      const feb = lastDayOfMonth(notice.y, 2);
      const mar = lastDayOfMonth(notice.y, 3);
      const candidates = [];
      if (gte(feb, notice)) candidates.push(feb);
      if (gte(mar, notice)) candidates.push(mar);
      candidates.push(t);
      candidates.sort((a, b) => cmp(a, b));
      for (const cand of candidates) {
        const check = isTermValid(notice, cand, minDays, "monthly");
        if (check.ok) return { t: cand, special: check.usedSpecial };
      }
    } else {
      // still check whether an earlier period end in Feb/March qualifies
      let cursor = periodEndOnOrAfter(notice, dueDay);
      for (let i = 0; i < 8; i++) {
        const check = isTermValid(notice, cursor, minDays, "monthly");
        if (check.ok) return { t: cursor, special: check.usedSpecial };
        cursor = nextPeriodEndAfter(cursor, dueDay);
      }
    }
    return { t: t, special: isTermValid(notice, t, minDays, "monthly").usedSpecial };
  }

  function earliestWeekly(notice, payWeekday, minDays) {
    // payWeekday: 0 Sun .. 6 Sat. Period ends the day before.
    const endWeekday = (payWeekday + 6) % 7;
    const minTerm = addDays(notice, minDays);
    const t = nextWeekdayOnOrAfter(minTerm, endWeekday);
    return { t: t, special: false, endWeekday: endWeekday };
  }

  function earliestDaily(notice, minDays) {
    return { t: addDays(notice, minDays), special: false };
  }

  function compute(input) {
    const notice = parseISO(input.noticeDate);
    if (!notice) return { error: "Enter a valid notice date." };
    const kind = input.kind;
    const minDays = kind === "weekly" || kind === "daily" ? 28 : 60;
    let result = { notice: toISO(notice), kind: kind, minDays: minDays };

    if (kind === "fixed") {
      const expiry = parseISO(input.expiryDate);
      if (!expiry) return { error: "Enter the last day of the fixed term." };
      const check = isTermValid(notice, expiry, minDays, "fixed");
      result.termination = toISO(expiry);
      result.lastNoticeDay = toISO(lastOrdinaryNoticeDay(expiry, minDays, "fixed"));
      result.usedSpecial = check.usedSpecial;
      result.valid = check.ok;
      if (!check.ok) {
        result.message =
          "Ordinary 60-day notice cannot be used for this expiry date, because the notice date is too late. The official N9 instructions describe other paths in limited cases. This tool does not date those paths.";
      } else if (check.usedSpecial) {
        result.message =
          "This termination date uses the official February or March notice rule, which can be shorter than 60 days.";
      } else {
        result.message =
          "For a fixed term, ordinary notice is effective on the expiration date, with at least 60 days' notice (or the February or March special rule if that date is the last day of February or March).";
      }
      return result;
    }

    if (kind === "daily") {
      const early = earliestDaily(notice, minDays);
      result.termination = toISO(early.t);
      result.lastNoticeDay = toISO(lastOrdinaryNoticeDay(early.t, minDays, "daily"));
      result.usedSpecial = false;
      result.valid = true;
      result.message = "For a daily tenancy, give at least 28 days' notice. The termination date must be the last day of a rental period.";
      return result;
    }

    if (kind === "weekly") {
      const pay = Number(input.payWeekday);
      if (!Number.isInteger(pay) || pay < 0 || pay > 6) return { error: "Choose the weekday rent is paid." };
      const early = earliestWeekly(notice, pay, minDays);
      result.termination = toISO(early.t);
      result.lastNoticeDay = toISO(lastOrdinaryNoticeDay(early.t, minDays, "weekly"));
      result.usedSpecial = false;
      result.valid = true;
      result.periodEndWeekday = early.endWeekday;
      result.message = "For a weekly tenancy, give at least 28 days' notice. The termination date must be the last day of a rental period.";
      return result;
    }

    // monthly
    const due = Number(input.dueDay);
    if (!Number.isInteger(due) || due < 1 || due > 31) return { error: "Enter the day of the month rent is due, from 1 to 31." };
    const early = earliestMonthly(notice, due, minDays);
    result.termination = toISO(early.t);
    result.lastNoticeDay = toISO(lastOrdinaryNoticeDay(early.t, minDays, "monthly"));
    result.usedSpecial = early.special;
    result.valid = true;
    if (early.special) {
      result.message =
        "This termination date uses the official February or March notice rule, which can be shorter than 60 days.";
    } else {
      result.message =
        "For a monthly tenancy, give at least 60 days' notice. The termination date must be the last day of a rental period.";
    }
    return result;
  }

  const api = {
    pad, make, toISO, parseISO, addDays, weekday, lastDayOfMonth,
    isLastDayOfFebruary, isLastDayOfMarch, periodEndOnOrAfter,
    lastOrdinaryNoticeDay, isTermValid, earliestMonthly, earliestWeekly,
    earliestDaily, compute, daysInMonth, cmp
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LeaseDates = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
