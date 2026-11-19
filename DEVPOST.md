# Devpost submission draft | Lease Exit Timer | Silicon Valley Buildathon

Draft only. Not submitted and no Devpost project page has been created.

## Project name

Lease Exit Timer

## Elevator pitch (200 characters max)

Know the last day to give Ontario tenant notice, with mail, courier and holiday time counted, so one late day does not cost another month of rent. The public rules sit beside the result.

## Thumbnail (3:2)

`docs/screenshots/thumbnail-3x2.png`

## About the project

### The problem

In Ontario, ending a monthly lease usually takes at least 60 days of notice on official Form N9, ending on the last day of a rental period. The rule sounds simple. The calendar is not. Two details catch people out. Notice sent by mail counts on the fifth day after mailing, not the day it goes in the post. And notice for the end of February or March has its own short rule. Miss the real last day by one day and the tenancy runs another month.

### What it does

Lease Exit Timer asks for:

1. the day you will send or give notice,
2. the kind of tenancy (monthly, fixed term, weekly or daily),
3. the rent day (or the weekday rent is paid, for a weekly tenancy),
4. for a fixed term only, the last day of the term as written in the lease, with a worked example beside the box,
5. how the notice will reach the landlord: by hand or mail box, Canada Post, courier, or email.

It returns:

- the earliest ordinary end date,
- the last day to send notice by the method you picked,
- a short timeline that shows the count, from the send day to the day notice counts to the end date,
- for courier, the exact weekend and holiday days the count moved past, with the rule for each,
- a Form N9 checklist right under the date: every field on the official form in order, with the termination date already written the way the form wants it (dd/mm/yyyy) and the last day to give it,
- a calendar file with a reminder one week before the last send day, a printable plan that includes the checklist, and an optional courtesy note. The page says plainly that the courtesy note is not Form N9 and does not give notice.

The fixed term end date is checked before anything is counted. An empty box, an impossible date, a date more than ten years out, or a term that has already ended each get a plain message and the box is marked. An end date that is not the day before a rent day gets a note to check the lease. A fixed term that is already too late is flagged in red, with the next ordinary monthly date to check under s. 38 (1).

Email is accepted only when the user ticks two boxes: the landlord agreed in writing to service by email (LTB rule 3.5), and that written consent covers a tenant's notice to end the tenancy. The Board's own Consent to Service by Email form lists rent increase notices, landlord entry notices, documents for a Board application and tenancy communication, and does not name a tenant's notice to end the tenancy, so the page asks the user to check. It then reminds them to include their name and phone number, attach the signed form, and keep a copy of the sent email and the consent. Special paths from the N9 instructions are listed, not dated, because they need facts the page does not ask for. Five example buttons show the main cases in one click, including a courier hand off on New Year's Eve. Nothing typed leaves the browser.

### How I built it

Plain HTML, CSS and JavaScript with no framework and no tracking. The date engine is a set of pure functions in `site/dates.js`, shared by the page and the Node tests. Rule text and sources live in `site/data/rules.json`. GitHub Actions runs the tests and publishes the page to GitHub Pages.

The rules come from the Residential Tenancies Act, 2006 (section 38 on fixed terms, section 44 on notice periods, section 47, which lets a tenant end a tenancy at the end of a period or term by notice under section 44, and section 191 on delivery), the Legislation Act, 2006 (section 88, the list of Ontario holidays, and section 89 (3), how days are counted), the official Form N9 and its instructions, the Board's Consent to Service by Email form, and rules 1.1, 3.1, 3.5 and 3.9 of the Landlord and Tenant Board Rules of Procedure. All of them are linked in the sources section of the page, and each step in "How it counts" links to its rule.

Courier timing follows rule 3.9: the day after hand off, or if that day is a holiday, the next day that is not. Rule 1.1 defines a holiday as any Saturday, Sunday or other day the Board's offices are closed. The engine computes the Legislation Act s. 88 holidays for any year: New Year's Day, Family Day, Good Friday, Easter Monday, Victoria Day, Canada Day (July 2 when July 1 is a Sunday), Labour Day, Thanksgiving, Remembrance Day, Christmas Day and Boxing Day, plus the extra Monday or Tuesday s. 88 adds when New Year's Day or Christmas Day falls on a weekend. Civic Holiday is not on the s. 88 list; the page counts it too, on purpose, because an extra holiday can only make the advised send day earlier.

### What I tested, and what testing changed

The first version passed all 27 of its hand written checks. Then I added a brute force check that walks every day from 2026 to 2029 and asks three questions of each answer: is it a real period end, is it legal, and is there any earlier legal day? The first version only knew hand delivery, so that first run covered hand delivery only: 20,454 cases (1,461 days times seven monthly rent days and seven weekly pay days). It found 1,650 failures.

- Rent due on the 29th, 30th or 31st picked the wrong period end in shorter months (1,647 cases). The engine now finds the due date in each month first, then steps back a day.
- Notice given on December 31 skipped the end of February the next year, even though section 44 (5) allows it (3 cases). The engine now checks every period end in order against both rules.

Reading section 191 (3) changed the main answer, and it is the clearest before and after in the project. The first version treated the send day as the day notice counts. Before: someone mailing on November 28, 2026 for a January 31, 2027 move was told they were fine. After: the page says mail sent that day counts on December 3, which leaves 59 days, so the earliest end moves to February 28, 2027, and the last day to mail for January 31 is November 27. Delivery method is now an input, and the result shows the last send day for that method.

The first round of outside review found a gap in the courier rule. It skipped weekends but not holidays. A courier hand off on December 31, 2026 was counted on January 1, 2027, which is New Year's Day, so the page said February 28 was reachable under the s. 44 (5) winter rule. With holidays counted, that notice counts on Monday, January 4, the winter rule no longer applies, and the earliest end is March 31. The last courier day for February 28 is December 30. That case is now a regression test and one of the example buttons.

The current build passes 27 original checks, 31 delivery and edge case checks, 55 checks for the holiday, email, fixed term and Form N9 changes, and 81,816 brute force cases across all four delivery methods (the 20,454 cases times four), plus 1,461 courier cases that confirm the counted day is the first day after hand off that is not a Saturday, Sunday or holiday. A browser check runs the page in Chromium at desktop and phone width, runs the five examples, confirms the skip link, refuses email until both consent boxes are ticked, checks the fixed term error, checks for sideways scroll, and runs axe-core 4.14 with WCAG 2.2 AA and best practice rules. On November 19, 2026, against the published page, it reported zero violations. An automated check is not a full accessibility audit. Details are in `docs/TESTING.md` in the repository.

Formal user testing with renters is still to come. Nothing in this entry claims a user study.

### Challenges

Counting days the way the law counts them, then counting backwards from a deadline through a delivery method. Deciding what not to automate: the page names special cases instead of guessing their dates.

### What I learned

The useful product is a date you can act on and the official form, not a longer letter. Saying plainly what a tool cannot date is part of the feature.

### What's next

Formal sessions with renters to see where they hesitate, a yearly tenancy option, and a French version.

### Limits, said plainly

Not legal advice. It does not file, send or sign anything. Special N9 paths are listed and not dated. Yearly tenancies are not offered. Courier and email timing rest on the Board's Rules of Procedure, which the Act brings in through s. 191 (1) (g) ("any other means allowed in the Rules") but which are written mainly for Board matters, so the page says so. A day fixed as a holiday by proclamation, or an unplanned office closure, cannot be known ahead. Under s. 191 (2) a notice that actually reached the landlord in time can still count; the page treats that as a fallback, not a plan.

### Team and reused components

Solo project by John Khan, Toronto, Ontario, a current student. No third party code ships in the page. Playwright and axe-core were used as test tools only.

## Built with

html, css, javascript, node.js, github-pages, github-actions, playwright, axe-core

## Try it out links

- Live demo: https://alenzacodes.github.io/lease-exit-timer/
- Source code and tests: https://github.com/ALENZACODES/lease-exit-timer
- What testing changed: https://github.com/ALENZACODES/lease-exit-timer/blob/main/docs/TESTING.md

## Video demo link

Silent walkthrough, 1 minute 29 seconds, captions on screen, no voice: https://youtu.be/AasmHYBD09k (unlisted). The same file is at `docs/demo/lease-exit-timer-walkthrough.mp4` in the repository.

## Image gallery

1. `docs/screenshots/01-home.png`: the page with a monthly result
2. `docs/screenshots/02-mail.png`: mail moves the end date a month
3. `docs/screenshots/03-winter.png`: the February rule
4. `docs/screenshots/04-late-fixed.png`: a fixed term that is too late
5. `docs/screenshots/05-mobile.png`: phone layout
6. `docs/screenshots/06-courier-holiday-n9.png`: courier moved past New Year's Day, with the Form N9 checklist
7. `docs/screenshots/07-email-consent.png`: the two email consent boxes

## Additional questions the form may ask

- **Problem or creative goal:** see "The problem" above.
- **Demo or visual walkthrough of the core feature:** the video above, plus the live link.
- **What you built and tested:** see "What I tested, and what testing changed".
- **Eligibility:** the entrant, John Khan, is a current student.
- **Reused tools and assets:** none ship in the page. Test tools: Playwright, axe-core. Hosting: GitHub Pages.
- **Team member contributions:** John Khan, everything (solo).
