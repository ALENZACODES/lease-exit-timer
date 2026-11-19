# Lease Exit Timer

**Live:** https://alenzacodes.github.io/lease-exit-timer/

Find the last day to give ordinary tenant notice in Ontario, with delivery time counted, and see the public rules the count uses.

The answer comes first, as one sentence you can act on, for example: "Send Form N9 by Canada Post by Thursday, December 24, 2026 to end your tenancy on February 28, 2027." Under it, when the days differ, is the legal limit: Monday, December 28, 2026, a Canada Post closure (Boxing Day observed).

**What is different.** A generic "60 days from today" count, for Form N9 mailed on Saturday, November 28, 2026, lands on January 27, 2027 and says the January 31 period end works. This page counts the notice on December 3, five days after mailing (s. 191 (3)), which leaves 59 days, so the earliest end is February 28, 2027 and the last day to mail for January 31 was November 27. It counts backward from the end date through the way you will actually deliver the notice, by hand, mail, courier or email, skips the days the rules skip, and shows the same end date for every method.

![A silent 18 second before, failure, fix capture: a generic 60 day count from November 28, 2026 makes January 31 look fine; mail is deemed served on December 3, so January 31 is already lost; the page now says mail by Thursday, December 24, with the legal limit Monday, December 28; then courier, where Sunday, January 31 is the legal limit and Friday, January 29 is the practical send by day. The video predates every outside review.](docs/screenshots/10-current-build.gif)

![The same input before and after. Generic 60 day count from Saturday, November 28, 2026: January 27, 2027, so January 31 looks fine. This page: mail counts on December 3, so the earliest end is February 28, 2027](docs/screenshots/00-before-after.png)

## The problem

Ending a lease in Ontario usually takes 60 days of notice on official Form N9, ending on the last day of a rental period. The hard part is the calendar. One late day can mean another month of rent, and two rules catch people out:

- Mail counts on the **fifth day after mailing**, not the day it is posted (Residential Tenancies Act, s. 191 (3)).
- Notice for the end of February or March has its **own short rule** (s. 44 (5)).

## What it does

1. Enter the day you will send or give notice, the kind of tenancy, and the rent day. A note beside the rent day says to check the rental period in the lease, because the day you usually pay is not always proof of it. For a fixed term, also enter the last day of the term as written in the lease. That date is checked first: empty, impossible, more than ten years out, or already over each get a plain message.
2. Pick how it will reach the landlord: by hand or mail box, Canada Post, courier, or email. Email needs two ticks: the landlord agreed in writing to service by email (LTB rule 3.5), and that consent covers a tenant's notice to end the tenancy.
3. Read the decision first, one sentence with the last day to send and the end date. Under it is the earliest ordinary end date, the last day to send notice that way, a short timeline that shows the count, and one line with the last day for every method for the same end date. When the last legal send day is a weekend or a closure, the page leads with a practical send by day and shows the legal limit under it. Mail uses Canada Post's official holiday calendar (December 25, December 28 as Boxing Day observed, and January 1 in this window). Courier still uses weekends, s. 88 holidays and Civic Holiday, and does not skip December 28 unless the Board is confirmed closed. Courier dates move past Saturdays and Sundays, which LTB rule 1.1 names as holidays, and past weekdays when the Board's offices may be closed: the Legislation Act s. 88 holidays and Civic Holiday. Rule 1.1 turns on actual office closures and no Board closure calendar could be found, so weekends are labelled VERIFIED and those weekdays UNKNOWN, counted as closed, and the page says when one changes the end date. A "Why this date" section explains the count, the closures and any holiday extension of a deadline.
4. Optionally enter the rent, and the page says how far one day late moves the end date, in the tenancy's own unit: one month for a monthly tenancy, one week for a weekly one, one day for a daily one. For example "Missing the last day by one day moves the end date by 1 month, about $1,850.00 more rent", or for a weekly tenancy at $400, "by 1 week, about $400.00". It says this is an estimate, not a bill, and that s. 16 of the Act gives a landlord who claims rent a duty to minimize losses.
5. Fill in Form N9 from the checklist under the date: every field the tenant or representative must complete on the official form, in order, with the termination date written as dd/mm/yyyy. The Office Use Only box is for the Board.
6. Save the last day to your calendar with a one week reminder, print the plan, or copy a courtesy note. The courtesy note is not Form N9 and does not give notice.

Five example buttons show the main cases in one click: an ordinary monthly notice, mail moving the date a month, the February rule, a courier hand off on New Year's Eve, and a fixed term that is already too late.

## What it will not do

It is not legal advice and it does not file, send or sign anything. Yearly tenancies are not offered. Courier and email timing rest on the Board's Rules of Procedure, which are written mainly for Board matters. The page shows the chain in "How courier and email connect to the Act": RTA s. 191 (1) (g) allows "any other means allowed in the Rules", s. 2 (1) defines the Rules as the Board's rules of practice and procedure, rule 3.1 adds courier and, with written consent under rule 3.5, email, and rule 3.9 says when each counts. A day fixed as a holiday by proclamation, or an unplanned office closure, cannot be known ahead. The January 1 and February 1 deadlines in s. 44 (5) are extended under Legislation Act s. 89 (1) when they fall on a Sunday or an s. 88 holiday; January 1 always is one, so notice by Saturday, January 2, 2027 still reaches February 28, 2027. LTB rule 1.14, through RTA s. 193, could be read to reach Monday, January 4, 2027; the page names that day and does not rely on it. The 60 and 28 day minimum periods are not extended. Special paths on the N9 instructions (a refused assignment, an N12 or N13, care homes, the standard lease demand, and notice for tenants who have experienced violence) are listed and not dated, because they need facts the page does not ask for. Nothing you type leaves the browser.

## Run it

```bash
python3 -m http.server 8080 --directory site
```

Open http://localhost:8080/. There is no build step.

## Tests

```bash
npm test
```

- `tests/test_dates.mjs` has the 27 original worked examples.
- `tests/test_delivery.mjs` has 31 checks for mail, courier, email, rent days 29 to 31, late fixed terms, bad input and the calendar file.
- `tests/test_courier_email_and_n9.mjs` has 55 checks for Ontario holidays in courier timing, the email consent guard, fixed term entry and the Form N9 checklist.
- `tests/test_statutory_service_and_n9.mjs` has 53 checks for the rent line, the last legal and practical send days, statutory holidays against assumed closures, the service chain, the Form N9 wording, and the Boxing Day mail note.
- `tests/test_closures_methods_and_limits.mjs` has 40 checks for the s. 88 weekend rules (January 1, 2028 on a Saturday adds no Monday; Canada Day 2029 moves to July 2), weekday holidays as assumed office closures, the date if the offices were open, the every method line, the rent estimate wording and the rental period note.
- `tests/test_deadlines_and_rent.mjs` has 59 checks for the s. 89 (1) extension of the January 1 and February 1 deadlines (2026, 2027, 2028, 2029 and 2034), the rule 1.14 day the page does not rely on, the minimum periods that are not extended, the VERIFIED and UNKNOWN closure labels, the Canada Post calendar (including Boxing Day observed on December 28), the practical send by day against the legal limit, the decision sentence and "Why this date", and the late rent estimate for weekly, daily, monthly and fixed term tenancies.
- `tests/test_property.mjs` checks the engine against an oracle with its own hard coded holiday table for 2026 to 2029, its own date maths and its own reading of the s. 89 (1) extension. It imports only the two engine functions it tests, compute() and holidaysIn(). The code is independent, but the reading of the law is not: I typed the table from the same reading of s. 88 and LTB rules 1.1 and 3.9, so a shared misreading would pass both. It checks 111,036 cases for every send day from 2026 to 2029, for monthly (seven rent days), weekly (seven pay days), daily, and fixed terms ending one to four months out, across four delivery methods. Each answer must match the oracle's earliest legal period end, last notice day and last send day. It also checks 1,461 courier hand offs (skipped days, their kinds, the date if the offices were open, and the every method line) and the four yearly holiday tables.
- `tests/browser_check.py` runs the page in Chromium at desktop and phone width, with five examples, the email and fixed term guards, the rent box, the every method line, a Civic Holiday case, a weekly rent case, the decision sentence, the deadline extension note, the service chain, and axe-core.

[docs/TESTING.md](docs/TESTING.md) explains what the tests found and what changed because of them. [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md) is my own structured walkthrough of the page, labelled as a self review, not user testing.

## How it is built

- `site/dates.js` is the date engine: pure functions, shared by the browser and the Node tests.
- `site/data/rules.json` holds the rule text and source list shown on the page.
- `site/app.js` and `site/index.html` are the interface. Plain HTML, CSS and JavaScript, no framework, no tracking.
- GitHub Actions runs `npm test` and publishes `site/` to GitHub Pages.

## Sources

Read on 19 November 2026, America/Toronto.

- Residential Tenancies Act, 2006, S.O. 2006, c. 17, ss. 2 (1), 16, 38, 44, 47, 191 and 193: https://www.ontario.ca/laws/statute/06r17
- Legislation Act, 2006, S.O. 2006, c. 21, Sched. F, ss. 87 and 88 (holidays), 89 (1) (a time limit that ends on a holiday) and 89 (3) (counting days): https://www.ontario.ca/laws/statute/06l21
- Form N9, Tenant's Notice to End the Tenancy (v. 01/04/2022): https://tribunalsontario.ca/documents/ltb/Notices%20of%20Termination%20%26%20Instructions/N9.pdf
- Landlord and Tenant Board Rules of Procedure, rules 1.1 (holiday), 1.14 (time ending on a holiday), 3.1 (other methods), 3.5 and 3.6 (email consent) and 3.9 (when documents count as served): https://tribunalsontario.ca/documents/ltb/Rules/LTB-Rules_of_Procedure.html
- Landlord and Tenant Board, Consent to Service by Email (v. 01/04/2022): https://tribunalsontario.ca/documents/ltb/Other%20Forms/Email%20Service%20Consent.pdf
- A guide to the standard lease for rental housing: https://files.ontario.ca/mmah-guide-to-standard-lease-for-rental-housing-en-2022-04-19.pdf

## Credits

Built by John Khan, Toronto, Ontario, a current student, for Silicon Valley Buildathon. Solo project. Reused parts: none beyond the browser platform. The accessibility check uses axe-core and Playwright as test tools only; neither ships in the page.

## License

MIT. See [LICENSE](LICENSE).
