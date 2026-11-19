# What testing changed

Lease Exit Timer started on 9 November 2026 as a small date counter with 27 hand written checks. Every one of those checks passed. The order of what happened next, with the commits in the repository:

| When (America/Toronto) | Commit | What happened |
| --- | --- | --- |
| 9 November 2026 | `e67f515` | First version: hand delivery only, 27 hand written checks. |
| 19 November 2026, morning | `4afd90f` | My own second pass, before any outside review: the brute force check (section 1), delivery methods (section 2) and the browser check. |
| 19 November 2026, morning | `2746fc3` | Screenshots and the silent walkthrough video. The video shows this build, so it shows nothing from the rows below. |
| 19 November 2026 | `c126a25` | Changes after the first round of outside review (section 6). |
| 19 November 2026 | `5f97a27` | Changes after the second round of outside review (section 7). |
| 19 November 2026 | `3780dfa` | Changes after the third round of outside review (section 8). |
| 19 November 2026, afternoon | `7ad21ca` | Changes after the fourth round of outside review (section 9). The documents and screenshots that describe it follow in the next commit. |

The brute force check is what changed the build first.

## 1. A brute force check found two real date errors

The first brute force check walked every day from 1 January 2026 to 31 December 2029, for monthly tenancies (seven rent due days) and weekly tenancies (all seven pay days). It did not cover daily tenancies or fixed terms; section 7 adds them. For every case it asks three questions. Is the answer a real rental period end? Is it legal under section 44? Is there any earlier day that would also have been legal?

Run against the first version, which only knew hand delivery, it covered 20,454 cases (1,461 days times seven monthly rent days and seven weekly pay days) and reported 1,650 failures.

- **Rent due on the 29th, 30th or 31st.** In months without that day, the first version picked a period end that was not the day before rent fell due. That covered 1,647 of the failures. The engine now finds the due date in each month first (the last day of the month when the number does not exist), then steps back one day.
- **Notice given on 31 December.** Section 44 (5) lets notice given by 1 January end a tenancy on the last day of February. The first version only looked at February of the year the notice was given, so notice on 31 December 2026 skipped 28 February 2027 and gave a later date. The engine now walks every period end in order and checks each one against both rules.

After the fix the engine passed all 81,816 cases (the same 20,454 cases for each of four delivery methods), and the 27 original checks still passed. Section 7 describes the independent version that replaced this check.

## 2. Reading the delivery rule changed the main answer

The first version asked for "the date you can give notice" and treated it as the day notice counts. Section 191 (3) of the Residential Tenancies Act says mail counts on the fifth day after mailing. A renter who mails Form N9 on 28 November 2026 for a 31 January 2027 move would be one day late and owe another month. 28 November 2026 is a Saturday; s. 191 (3) counts calendar days and has no weekend adjustment, so the date is not a typo.

The page now asks how notice will reach the landlord and shows two dates: the day notice must count by, and the last day to send it that way. Email is refused unless the user confirms the landlord agreed in writing, because rules 3.1 and 3.5 of the Board's rules only allow email with written consent. Courier uses rule 3.9. The first round handled weekends only; section 6 below covers the holiday fix.

`tests/test_delivery.mjs` pins those cases, including the 27 versus 28 November mail edge.

## 3. Checking the counting rule

The day count follows the Legislation Act, 2006, s. 89 (3): leave out the day notice is given, count the termination day, even when the rule says "at least". Notice given on 2 December 2026 reaches 31 January 2027 with exactly 60 days, and the email test checks that number.

## 4. A late fixed term now gets a next step

A fixed term that is too late used to end at "not valid". Section 38 (1) says a fixed term that ends without notice continues as a monthly tenancy. The page now shows the next ordinary monthly date as something to check, and says plainly that it is not an early exit from the fixed term.

## 5. Accessibility and layout

`tests/browser_check.py` loads the page in Chromium at 1280 and 390 pixels wide, runs the five example buttons, checks the visible answers and the Form N9 checklist, confirms the first Tab stop is the skip link, confirms email is refused until both consent boxes are ticked, checks the empty fixed term error and its aria-invalid mark, checks the decision sentence, the deadline extension note, the UNKNOWN closure labels and a weekly rent case, checks there is no sideways scroll, and runs axe-core 4.14 with the WCAG 2.2 AA and best practice rule sets. Result on 19 November 2026, America/Toronto, run against the published GitHub Pages site after each deploy, most recently after the changes in section 9: no violations in any state checked. An automated check is not a full accessibility audit, and no manual screen reader pass is claimed.

That check found one layout bug during the rebuild. A CSS grid rule overrode the `hidden` attribute, so the fixed term and weekly fields showed for every tenancy type. A global `[hidden]` rule fixed it.

## 6. After the first outside review

Two outside reviews of the first build found real gaps. Each fix has tests in `tests/test_round2.mjs` (55 checks).

- **Holidays in the courier rule.** Rule 3.9 counts a courier delivery the day after hand off, or if that is a holiday, the next day that is not. Rule 1.1 defines a holiday as any Saturday, Sunday or other day the Board's offices are closed. The first build skipped weekends only. The engine now computes the Legislation Act, 2006, s. 88 holidays for any year, including Easter dates and the special cases in s. 88 (3), (4) and (5): when New Year's Day falls on a Sunday the Monday after is also a holiday; when July 1 is a Sunday, Canada Day is July 2; when Christmas Day falls on a Saturday the Monday after is also a holiday, and when it falls on a Sunday the Tuesday after is. A New Year's Day on a Saturday adds nothing. Civic Holiday is not on the s. 88 list; it is counted too, on purpose, because an extra holiday can only make the advised send day earlier. Section 7 describes how the page now keeps it apart from statutory holidays. Before the fix, a courier hand off on 31 December 2026 counted on 1 January 2027 and the page offered 28 February 2027 under the winter rule. Now it counts on 4 January, and the earliest end is 31 March 2027. The last courier day for 28 February is 30 December. The brute force file also checks 1,461 courier hand offs: the counted day must be the first day after hand off that is not a Saturday, Sunday or holiday.
- **Email scope.** Rule 3.5 allows email service only with written consent. The Board's Consent to Service by Email form lists rent increase notices, landlord entry notices, documents for a Board application and tenancy communication, and does not name a tenant's notice to end the tenancy. Email now needs two ticks: consent exists, and it covers this notice. The guard moved into the date engine so tests can check it, and the page reminds the user to include a name and phone number and keep proof.
- **Fixed term entry.** The fixed term end date now has its own label, a worked example, and checks for an empty box, an impossible date, a date more than ten years out, and a term that has already ended. An end date that is not the day before a rent day gets a note to check the lease.
- **Form N9 checklist.** Every field on the official form, in order, appears under the date, with the termination date already written as dd/mm/yyyy and the last day to give it. The page says the courtesy note is not Form N9.
- **Draft accuracy.** The Devpost draft now says the first brute force run was hand delivery only, cites RTA s. 47 and Legislation Act s. 88, and no longer says every date links to its rule.

## 7. After the second outside review

The second round of review found that the brute force check was not independent, that two claims were too broad, and that two links in the reasoning were not shown. Each change has tests in `tests/test_round3.mjs` (52 checks), and the brute force file was rewritten.

- **An independent oracle.** The 1,461 courier checks used to get their holidays from the same `holidaysIn()` they were testing. `tests/test_property.mjs` now has its own hard coded table of 2026 to 2029 holidays, typed from the s. 88 list with each day marked statutory or assumed, and its own date maths. It imports only `compute()` and `holidaysIn()` from the engine, the two functions it tests, and compares them with its own answers. The code is independent; the reading of the law is not. I typed the table from the same reading of s. 88 and rules 1.1 and 3.9, so a shared misreading would pass both. It now also covers daily tenancies and fixed terms ending one to four months out, so it checks 111,036 cases (1,461 send days, four methods, and 19 tenancy shapes), plus 1,461 courier hand offs and the four yearly holiday tables. To check the oracle itself, I removed one holiday (27 December 2027) from its table and got 65 failures, then changed its mail lag to four days and got 27,759 failures. Both were put back.
- **Statutory holidays and assumed closures.** Civic Holiday is now marked as an assumed Board office closure, not a statutory holiday. Courier skipped days are grouped under weekends, statutory holidays and assumed closures, and when the assumption alone moves the end date the page says so. Example: a courier hand off on 30 July 2027, rent due on the 2nd, ends on 1 November 2027 with the Civic Holiday counted, and the page notes that it would be 1 October 2027 without it.
- **The service chain.** `rules.json` now ties RTA s. 191 (1) (g) to s. 2 (1), which defines "Rules", and to LTB rules 3.1 (courier, and email with written consent), 3.5 (consent), 3.6 (withdrawing it) and 3.9 (when each counts). The page shows the chain with each quote as its own line.
- **Form N9 wording.** The checklist now says "every field the tenant or representative must complete", and names the Office Use Only box as the Board's.
- **Money at stake.** An optional rent box adds an estimate of the extra rent for the later end date. Section 8 softened its wording.
- **The last working day.** When the last day to mail or courier is a weekend or a statutory holiday, the page adds the last working day before it. This came from my own walkthrough (docs/WALKTHROUGH.md).
- **Wording.** The README tagline no longer says every date links to its rule, the timeline above replaces a sentence that put the brute force check in the wrong order, and section 1 now says what the first brute force check did not cover.

## 8. After the third outside review

Each change has tests in `tests/test_round4.mjs` (40 checks), and the oracle now checks more.

- **Holidays are office closures under rule 1.1.** Rule 1.1 makes a weekday a holiday only if the Board's offices are closed. The s. 88 list does not settle that, and I have not found a Board closure calendar to check. The page now names Saturdays and Sundays as holidays under rule 1.1 by name, and calls every weekday it skips, the s. 88 holidays and Civic Holiday alike, an assumed office closure. When the assumption changes the end date, the page says what the date would be if the offices were open. Example: a courier hand off on 31 December 2026 ends on 31 March 2027; if the offices were open on New Year's Day it would count on 1 January and 28 February 2027 could be available. A Saturday or Sunday that is also on the s. 88 list, such as 1 January 2028, is shown as a weekend day, because it does not depend on an assumption. The oracle checks the kind of every skipped day and the date with the offices open.
- **The s. 88 weekend rules, said exactly.** Section 6 above described them too broadly; it is now fixed. The engine already had them right. New tests: 1 January 2028 is a Saturday and adds no holiday on 3 January; 1 July 2029 is a Sunday, so Canada Day is 2 July and a courier hand off on 29 June 2029 counts on 3 July.
- **Every method for the same end date.** A line under the timeline gives the last day for hand delivery, Canada Post, courier and email for the same end date, for 31 January 2027: by hand 2 December, Canada Post 27 November, courier 1 December and email 2 December 2026. The tests check that each of those days still reaches the end date and the next day does not, and the oracle checks every line.
- **A softer rent line.** It read "One day late could mean about $X more rent" and said it is an estimate from the rent typed in, not a bill. Section 9 replaced it with a line that names the period unit.
- **The rental period.** A note beside the rent day box says the rental period is set by the tenancy agreement, and the day you usually pay is not always proof of it, especially on the 29th, 30th or 31st.
- **Limits.** The page and the draft said that RTA s. 193, LTB rule 1.14 and Legislation Act s. 89 (1) can let a time limit that ends on a holiday be met on the next day, and that the page did not use that extension. Section 9 resolves it.
- **Wording.** The oracle is no longer described as sharing no code with the engine. The draft lists rule 3.6, says what the video shows and does not show, and puts a before and after image first in the gallery.

## 9. After the fourth outside review

Each change has tests in `tests/test_deadlines_and_rent.mjs` (43 checks), and the oracle in `tests/test_property.mjs` has its own reading of the extension.

- **The holiday extension of the s. 44 (5) deadlines.** Both reviewers asked for this to be resolved, not avoided. I read Legislation Act ss. 87 to 89 and LTB rules 1.1 and 1.12 to 1.16 again. Section 89 (1) says time limits that would otherwise expire on a holiday are extended to include the next day that is not a holiday, and Part VI applies to every Act (s. 46). A holiday there is a Sunday or a day on the s. 88 list; Saturday is not on it. The January 1 deadline is always a holiday, so it always moves: to Saturday, January 2 in 2027, to Monday, January 3 in 2028 (January 1 is a Saturday but still New Year's Day, and January 2 is a Sunday), to Tuesday, January 2 in 2029, and to Tuesday, January 3 in 2034, when January 1 is a Sunday and s. 88 (3) makes January 2 a holiday too. February 1 moves only when it is a Sunday, as in 2026. The engine now uses the extended day as the last notice day for the end of February or March. Rule 1.14, through RTA s. 193, says a thing whose time ends on a holiday may be done on the next day that is not a holiday, and rule 1.1 makes Saturdays holidays, so it could reach Monday, January 4, 2027. The page names that day and does not rely on it, because it is not clear the Board's procedural rules govern a notice given before any application. The 60 and 28 day minimum periods are not extended: they are minimum notice periods, not time limits that expire. That is my reading and the page says so.
- **Three original checks changed.** In `tests/test_dates.mjs` the last notice day for February 28, 2027 is now January 2, not January 1, and notice on January 2 now reaches February 28, not March 31, with a comment citing s. 89 (1). One check in `tests/test_round3.mjs` changed for the same reason: mail sent on Saturday, November 28, 2026 for February 28 can now be posted as late as Monday, December 28, a working day, instead of Sunday, December 27 with a working day of December 24.
- **Board closures.** I could not find a published Board closure calendar. The page now labels Saturdays and Sundays VERIFIED, because rule 1.1 names them, and every weekday closure UNKNOWN, counted as closed, and keeps the date if the offices were open.
- **The rent estimate by period unit.** The engine already counted the extra rent in weeks for a weekly tenancy and days for a daily one, but nothing tested it and the wording read as if a month were always at stake. The line now says "Missing the last day by one day moves the end date by 1 week, about $400.00 more rent" (or day, or month), names the unit of the rent typed in, and mentions the duty to minimize losses in RTA s. 16. Tests cover weekly, daily, monthly, weekly by mail and a fixed term that falls back to monthly.
- **The decision first.** The result opens with one sentence, for example "Send Form N9 by courier by January 31, 2027 to end your tenancy on March 31, 2027". The reasons, the holiday extension and the courier closures sit in a "Why this date" section under the timeline, open when there is a closure or an extension to read.
- **Stale claims.** The video's closing card calls 81,816 cases the first brute force run; the first run was 20,454 cases (section 1), and the draft now says so. `docs/WALKTHROUGH.md` rows 1, 4 and 5 are marked as superseded where later changes replaced them. The headings above no longer use round numbers that did not match the draft.
- **A current build capture.** `docs/screenshots/10-current-build.gif` is a silent 18 second capture made by automated browser capture of the current build. It is a gallery image, not a new video.

## How to run

```bash
npm test
python3 -m http.server 8931 --directory site
python3 tests/browser_check.py http://127.0.0.1:8931/ path/to/axe.min.js
```

Node 18 or newer runs the unit and brute force tests with no installs. The browser check needs Python Playwright, and axe-core if you want the accessibility pass.

## What has not been tested

No renter has used this page in a recorded session yet. Formal user testing is still to come. Nothing here claims a user study. docs/WALKTHROUGH.md is my own structured walkthrough against usability heuristics, labelled as such; it is not user testing.
