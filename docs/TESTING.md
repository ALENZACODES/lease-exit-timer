# What testing changed

Lease Exit Timer started on 9 November 2026 as a small date counter with 27 hand written checks. Every one of those checks passed. The second round of work on 19 November 2026 added a brute force check, and that check is what changed the build.

## 1. A brute force check found two real date errors

`tests/test_property.mjs` walks every day from 1 January 2026 to 31 December 2029. For each day it tries four delivery methods and seven rent due days for monthly tenancies, and all seven pay days for weekly tenancies. For every case it asks three questions. Is the answer a real rental period end? Is it legal under section 44? Is there any earlier day that would also have been legal?

Run against the first version (hand delivery only, 20,454 cases), it reported 1,650 failures.

- **Rent due on the 29th, 30th or 31st.** In months without that day, the first version picked a period end that was not the day before rent fell due. That covered 1,647 of the failures. The engine now finds the due date in each month first (the last day of the month when the number does not exist), then steps back one day.
- **Notice given on 31 December.** Section 44 (5) lets notice given by 1 January end a tenancy on the last day of February. The first version only looked at February of the year the notice was given, so notice on 31 December 2026 skipped 28 February 2027 and gave a later date. The engine now walks every period end in order and checks each one against both rules.

The current engine passes all 81,816 brute force cases, and the 27 original checks still pass.

## 2. Reading the delivery rule changed the main answer

The first version asked for "the date you can give notice" and treated it as the day notice counts. Section 191 (3) of the Residential Tenancies Act says mail counts on the fifth day after mailing. A renter who mails Form N9 on 28 November 2026 for a 31 January 2027 move would miss it by a few days and owe another month.

The page now asks how notice will reach the landlord and shows two dates: the day notice must count by, and the last day to send it that way. Email is refused unless the user confirms the landlord agreed in writing, because rule 3.1 of the Board's rules only allows email with written consent. Courier uses rule 3.9, with weekends handled and a visible warning about other holidays.

`tests/test_delivery.mjs` pins those cases, including the 27 versus 28 November mail edge.

## 3. Checking the counting rule

The day count follows the Legislation Act, 2006, s. 89 (3): leave out the day notice is given, count the termination day, even when the rule says "at least". Notice given on 2 December 2026 reaches 31 January 2027 with exactly 60 days, and the email test checks that number.

## 4. A late fixed term now gets a next step

A fixed term that is too late used to end at "not valid". Section 38 (1) says a fixed term that ends without notice continues as a monthly tenancy. The page now shows the next ordinary monthly date as something to check, and says plainly that it is not an early exit from the fixed term.

## 5. Accessibility and layout

`tests/browser_check.py` loads the page in Chromium at 1280 and 390 pixels wide, runs the four example buttons, checks the visible answers, confirms the first Tab stop is the skip link, confirms email is refused without consent, checks there is no sideways scroll, and runs axe-core 4 with the WCAG 2.2 AA and best practice rule sets. Result on 19 November 2026: no violations in any state.

That check found one layout bug during the rebuild. A CSS grid rule overrode the `hidden` attribute, so the fixed term and weekly fields showed for every tenancy type. A global `[hidden]` rule fixed it.

## How to run

```bash
npm test
python3 -m http.server 8931 --directory site
python3 tests/browser_check.py http://127.0.0.1:8931/ path/to/axe.min.js
```

Node 18 or newer runs the unit and brute force tests with no installs. The browser check needs Python Playwright, and axe-core if you want the accessibility pass.

## What has not been tested

No renter has used this page in a recorded session yet. Nothing here claims a user study.
