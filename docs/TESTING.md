# What testing changed

Lease Exit Timer started on 9 November 2026 as a small date counter with 27 hand written checks. Every one of those checks passed. The second round of work on 19 November 2026 added a brute force check, and that check is what changed the build.

## 1. A brute force check found two real date errors

`tests/test_property.mjs` walks every day from 1 January 2026 to 31 December 2029. For each day it tries four delivery methods and seven rent due days for monthly tenancies, and all seven pay days for weekly tenancies. For every case it asks three questions. Is the answer a real rental period end? Is it legal under section 44? Is there any earlier day that would also have been legal?

Run against the first version, which only knew hand delivery, it covered 20,454 cases (1,461 days times seven monthly rent days and seven weekly pay days) and reported 1,650 failures.

- **Rent due on the 29th, 30th or 31st.** In months without that day, the first version picked a period end that was not the day before rent fell due. That covered 1,647 of the failures. The engine now finds the due date in each month first (the last day of the month when the number does not exist), then steps back one day.
- **Notice given on 31 December.** Section 44 (5) lets notice given by 1 January end a tenancy on the last day of February. The first version only looked at February of the year the notice was given, so notice on 31 December 2026 skipped 28 February 2027 and gave a later date. The engine now walks every period end in order and checks each one against both rules.

The current engine passes all 81,816 brute force cases (the same 20,454 cases for each of four delivery methods), and the 27 original checks still pass.

## 2. Reading the delivery rule changed the main answer

The first version asked for "the date you can give notice" and treated it as the day notice counts. Section 191 (3) of the Residential Tenancies Act says mail counts on the fifth day after mailing. A renter who mails Form N9 on 28 November 2026 for a 31 January 2027 move would be one day late and owe another month.

The page now asks how notice will reach the landlord and shows two dates: the day notice must count by, and the last day to send it that way. Email is refused unless the user confirms the landlord agreed in writing, because rule 3.1 of the Board's rules only allows email with written consent. Courier uses rule 3.9. The first round handled weekends only; section 6 below covers the holiday fix.

`tests/test_delivery.mjs` pins those cases, including the 27 versus 28 November mail edge.

## 3. Checking the counting rule

The day count follows the Legislation Act, 2006, s. 89 (3): leave out the day notice is given, count the termination day, even when the rule says "at least". Notice given on 2 December 2026 reaches 31 January 2027 with exactly 60 days, and the email test checks that number.

## 4. A late fixed term now gets a next step

A fixed term that is too late used to end at "not valid". Section 38 (1) says a fixed term that ends without notice continues as a monthly tenancy. The page now shows the next ordinary monthly date as something to check, and says plainly that it is not an early exit from the fixed term.

## 5. Accessibility and layout

`tests/browser_check.py` loads the page in Chromium at 1280 and 390 pixels wide, runs the five example buttons, checks the visible answers and the Form N9 checklist, confirms the first Tab stop is the skip link, confirms email is refused until both consent boxes are ticked, checks the empty fixed term error and its aria-invalid mark, checks there is no sideways scroll, and runs axe-core 4.14 with the WCAG 2.2 AA and best practice rule sets. Result on 19 November 2026, America/Toronto, run against the published GitHub Pages site after the round 2 deploy: no violations in any state checked. An automated check is not a full accessibility audit, and no manual screen reader pass is claimed.

That check found one layout bug during the rebuild. A CSS grid rule overrode the `hidden` attribute, so the fixed term and weekly fields showed for every tenancy type. A global `[hidden]` rule fixed it.

## 6. Round 2: what outside review changed

Two outside reviews of the round 1 build found real gaps. Each fix has tests in `tests/test_round2.mjs` (55 checks).

- **Holidays in the courier rule.** Rule 3.9 counts a courier delivery the day after hand off, or if that is a holiday, the next day that is not. Rule 1.1 defines a holiday as any Saturday, Sunday or other day the Board's offices are closed. The first build skipped weekends only. The engine now computes the Legislation Act, 2006, s. 88 holidays for any year, including Easter dates and the extra days s. 88 (3), (4) and (5) add when New Year's Day, Canada Day or Christmas Day falls on a weekend. Civic Holiday is not on the s. 88 list; it is counted too, on purpose, because an extra holiday can only make the advised send day earlier. Before the fix, a courier hand off on 31 December 2026 counted on 1 January 2027 and the page offered 28 February 2027 under the winter rule. Now it counts on 4 January, and the earliest end is 31 March 2027. The last courier day for 28 February is 30 December. The brute force file also checks 1,461 courier hand offs: the counted day must be the first day after hand off that is not a Saturday, Sunday or holiday.
- **Email scope.** Rule 3.5 allows email service only with written consent. The Board's Consent to Service by Email form lists rent increase notices, landlord entry notices, documents for a Board application and tenancy communication, and does not name a tenant's notice to end the tenancy. Email now needs two ticks: consent exists, and it covers this notice. The guard moved into the date engine so tests can check it, and the page reminds the user to include a name and phone number and keep proof.
- **Fixed term entry.** The fixed term end date now has its own label, a worked example, and checks for an empty box, an impossible date, a date more than ten years out, and a term that has already ended. An end date that is not the day before a rent day gets a note to check the lease.
- **Form N9 checklist.** Every field on the official form, in order, appears under the date, with the termination date already written as dd/mm/yyyy and the last day to give it. The page says the courtesy note is not Form N9.
- **Draft accuracy.** The Devpost draft now says the first brute force run was hand delivery only, cites RTA s. 47 and Legislation Act s. 88, and no longer says every date links to its rule.

## How to run

```bash
npm test
python3 -m http.server 8931 --directory site
python3 tests/browser_check.py http://127.0.0.1:8931/ path/to/axe.min.js
```

Node 18 or newer runs the unit and brute force tests with no installs. The browser check needs Python Playwright, and axe-core if you want the accessibility pass.

## What has not been tested

No renter has used this page in a recorded session yet. Formal user testing is still to come. Nothing here claims a user study.
