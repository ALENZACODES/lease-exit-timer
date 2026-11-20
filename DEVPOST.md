# Devpost submission draft | Lease Exit Timer | Silicon Valley Buildathon

Draft only. Not submitted and no Devpost project page has been created.

## Project name

Lease Exit Timer

## Elevator pitch (200 characters max)

Ontario renters: the last day to send tenant notice, counted backward through the way you will deliver it (hand, mail, courier or email), so one late day does not add another rent period.

## Thumbnail (3:2)

`docs/screenshots/thumbnail-3x2.png`

## About the project

### The problem, in one example

Say you mail Form N9 on Saturday, November 28, 2026 to leave your apartment. A "60 days from today" count says you can leave on January 31, 2027. You cannot. Mailed notice counts five days later, on December 3, which leaves 59 days, so the earliest end is February 28, 2027. That one mistake is a month of rent.

Lease Exit Timer gives the answer as one sentence: "Send Form N9 by Canada Post by Thursday, December 24, 2026 to end your tenancy on February 28, 2027." It picks December 24 because the days after it are Christmas, a weekend and the Boxing Day holiday, none of them a day with confirmed mail collection. It also says how to make the mailing day provable: hand it over a post office counter, not into a street box, and keep the dated receipt. If you miss the counter, it tells you the last day to give it by hand instead.

### What it does

Enter the day you will send notice, the kind of tenancy, the rent day, and how the notice will reach the landlord: by hand, Canada Post, courier, or email with written consent. Optionally add the rent, to see what one late day costs.

The result opens with the send by day and the end date, then the last day for every method, a short timeline, and a "Why this date" section with the statute and Board rule behind each step. Where the law is unsettled, the safe date leads and the other reading is shown on its own line, marked "Contingent, not advised". A Form N9 checklist and the sources sit beside the result. Nothing typed leaves the browser.

### How I built it

Plain HTML, CSS and JavaScript. One date engine, `site/dates.js`, is shared by the page and the tests. Colours: dark blue #011F5B and dark red #990000 on white. Built by John Khan, Toronto, Ontario, solo, for the Silicon Valley Buildathon, under my personal GitHub handle ALENZACODES. MIT licence.

### How it got here

1. **First version:** a 60 day count with 27 checks, all passing.
2. **Brute force:** a check of every send day from 2026 to 2029, 20,454 cases, found 1,650 failures: 1,647 for rent due on the 29th to the 31st, and a December 31 notice that skipped to February 28. Both fixed; the engine then passed 81,816 cases across four delivery methods.
3. **The mail rule:** reading the Act's five day rule for mail moved the main answer for the November 28 case by a month.
4. **Holidays:** courier timing, the Canada Post holiday calendar, and Board closures marked UNKNOWN and counted as closed.
5. **v1.7.0, the safe headline:** where a date works only on one reading of the law, the safe date leads. With that rule turned off, 120 headline checks fail.
6. **v1.8.0, now:** the counter safeguard for mail, and a fresh reading of the Board's rule 3.9, which counts an email on the day it was sent with no time of day cutoff.

Eight rounds of written rubric review on 19 and 20 November 2026 scored a written brief against the event criteria and listed fixes. The reviewers read the brief only; they did not run the page and they are not renters. `docs/TESTING.md` lists every change and its tests.

### What I tested

`npm test` has 28 date checks, 31 delivery, 55 courier, email and N9, 53 statutory service and N9, 40 closures, methods and limits, 60 deadline and rent, 91 literal deadline and closures, 44 safe headline and mailing day, 14 mailing safeguard and email, and a separate oracle of 111,036 cases plus 64,284 headline checks, 1,461 courier hand offs and 4 holiday tables, all passing at v1.8.0. A browser check at desktop and phone width runs axe-core 4.14 under WCAG 2.2 AA and best practice rules in 16 page states with no violations. The live page, the source, Form N9, the statute and Board pages and the video link each returned HTTP 200 when checked on 20 November 2026. I also did a keyboard and accessibility tree self check on v1.8.0: 37 Tab stops in reading order, each with a visible outline except one stop inside the browser's own date field. No screen reader software was used, and that check is not a screen reader test. No renter has used the page in a recorded session, and nothing here claims a user study.

### Video

https://youtu.be/AasmHYBD09k

The video was recorded at commit `2746fc3`, before every rubric review, and it is kept unchanged. It does not show the later calendar work, the send by day, the Canada Post holidays, the safe headline or the counter safeguard. The live page shows all of them, and so does the GIF, which was captured from v1.8.0.

Erratum: the video's closing card calls 81,816 cases the first brute force run. The first run was 20,454 cases, with 1,650 failures. 81,816 is the number the fixed engine passed once four delivery methods were added.

## Built with

HTML, CSS, JavaScript. Playwright and axe-core as test tools only. Hosted on GitHub Pages.

## Try it

https://alenzacodes.github.io/lease-exit-timer/

Source: https://github.com/ALENZACODES/lease-exit-timer

## Gallery

1. `docs/screenshots/10-current-build.gif`: a silent 36 second capture of v1.8.0, the current build, doing one full task. Saturday, November 28, 2026 by Canada Post: send by Thursday, December 24 to end on February 28, 2027, with Sunday, December 27 called only the theoretical last mailing day and the counter advice under it. Then the same end date by every method, then notice by hand on Saturday, January 2, 2027: the headline is March 31, 2027, February 28 is marked "Contingent, not advised", and the Form N9 checklist says 31/03/2027. Made by automated browser capture, no voice. A gallery image, not a new video.
2. `docs/screenshots/00-before-after.png`: the same November 28 mail input, generic 60 day count against this page (also the thumbnail)
3. `docs/screenshots/11-v180-mail-decision.png`: the November 28 mail decision sentence
4. `docs/screenshots/12-v180-mailing-safeguard.png`: the theoretical last mailing day and the post office counter advice
5. `docs/screenshots/13-v180-safe-headline.png`: notice by hand on January 2, 2027, with the safe end date first
6. `docs/screenshots/14-v180-n9-checklist.png`: the Form N9 checklist with 31/03/2027
7. `docs/screenshots/02-mail.png`: the whole mail result, with the every method line and the rent estimate
8. `docs/screenshots/08-civic-holiday.png`: a weekday closure that changes the end date, marked UNKNOWN and said plainly
9. `docs/screenshots/09-service-chain.png`: how courier and email connect to the Act
10. `docs/screenshots/06-courier-holiday-n9.png`: courier moved past New Year's Day, with the Form N9 checklist
11. `docs/screenshots/03-winter.png`: the February rule
12. `docs/screenshots/04-late-fixed.png`: a fixed term that is too late
13. `docs/screenshots/07-email-consent.png`: the two email consent boxes
14. `docs/screenshots/05-mobile.png`: phone layout
15. `docs/screenshots/01-home.png`: the page with a monthly result

## Additional questions the form may ask

- **Problem or creative goal:** see "The problem" above.
- **Demo or visual walkthrough of the core feature:** the video above (recorded before every rubric review, with the erratum above), the v1.8.0 GIF, and the live link.
- **What you built and tested:** see "What I tested, and what testing changed".
- **Eligibility:** the entrant, John Khan, is a current student, is above the age of majority in Ontario, Canada, where he lives, and entered solo. ALENZACODES is his personal GitHub handle, not a company or professional organization. The event window is November 8 to December 15, 2026. The project was built during it: the first commit, `e67f515`, is dated 9 November 2026, and version 1.8.0 is dated 20 November 2026.
- **Reused tools and assets:** none ship in the page. Test tools: Playwright, axe-core. Hosting: GitHub Pages.
- **Team member contributions:** John Khan, everything (solo).
