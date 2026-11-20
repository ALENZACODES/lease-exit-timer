# Devpost submission draft | Lease Exit Timer | Silicon Valley Buildathon

Draft only. Not submitted and no Devpost project page has been created.

## Project name

Lease Exit Timer

## Elevator pitch (200 characters max)

Ontario renters: the last day to send tenant notice, counted backward through the way you will deliver it (hand, mail, courier or email), so one late day does not cost another month of rent.

## Thumbnail (3:2)

`docs/screenshots/thumbnail-3x2.png`

## About the project

### The problem

In Ontario, ending a monthly lease usually takes at least 60 days of notice on official Form N9, ending on the last day of a rental period. Mail counts on the fifth day after mailing, not the day it goes in the post (Residential Tenancies Act, s. 191 (3)). Notice for the end of February or March has its own short rule (s. 44 (5)). Miss the real last day by one day and the tenancy runs another month.

### What is different

Form N9 mailed on Saturday, November 28, 2026: a generic "60 days from today" count lands on January 27, 2027, so January 31 looks fine. This page counts the notice on December 3, which leaves 59 days, so the earliest end is February 28, 2027, and the last day to mail for January 31 was November 27. The decision is a practical send by day: "Send Form N9 by Canada Post by Thursday, December 24, 2026 to end your tenancy on February 28, 2027." Under it is the theoretical last mailing day on the literal January 1 date in s. 44 (5): Sunday, December 27, 2026. That is not a day with confirmed postal collection; a letter put in a street box that Sunday may not be postmarked until Tuesday, December 29. Monday, December 28 is shown on its own line as working only on the author's reading of Legislation Act s. 89 (1), and Canada Post lists it as a holiday with no collection or delivery (Boxing Day observed).

### What it does

Enter the send day, the kind of tenancy, the rent day (with a note to check the rental period in the lease), and how the notice will reach the landlord: by hand or mail box, Canada Post, courier, or email with written consent. Optionally add the rent, to show what one late day would cost.

The result opens with the practical send by day and the end date. When that day is earlier than the legal limit, the legal limit sits under the sentence. Then come the last day for every method, a short timeline, and a "Why this date" section.

The advised day and the headline end date always meet the literal January 1 and February 1 dates in s. 44 (5). Legislation Act s. 89 (1) says "Time limits that would otherwise expire on a holiday are extended to include the next day that is not a holiday." Whether that moves these fixed dates has not been decided in any case I can cite, and s. 44 (5) is worded as a deeming rule, not a time limit. So when a notice reaches an earlier end date only on that reading, the safe date leads. Notice by hand on Saturday, January 2, 2027 gives "end your tenancy on March 31, 2027", and March 31 is the date on the Form N9 checklist; February 28 is shown on its own line, marked "Contingent, not advised". LTB rule 1.15 lets a notice be delivered on a holiday, so notice by hand on January 1 itself needs no extension.

Mail uses its own Canada Post closure calendar, taken from the official holiday schedule (read 19 November 2026, America/Toronto): in this window, December 25, December 28 (Boxing Day observed) and January 1. The schedule does not promise weekend collection, so weekends are not counted as mailing days, and the page advises a dated counter receipt as evidence of the mailing day. Canada Post has published 2026 and 2027; the page calculates 2028 to 2035 from the same holiday names and says so when an advised day depends on a calculated year. Courier skips weekends, the Legislation Act s. 88 holidays, Civic Holiday, and December 28 when Boxing Day falls on a weekend. Weekday Board closures are labelled UNKNOWN and counted as closed, which can only make the advised day earlier. The courier advice says it assumes no Saturday pickup.

A Form N9 checklist and the sources sit beside the result. Nothing typed leaves the browser.

### How I built it

Plain HTML, CSS and JavaScript. The date engine in `site/dates.js` is shared by the page and the tests. Colours: dark blue #011F5B and dark red #990000 on white. Built by John Khan, Toronto, Ontario, solo, for the Silicon Valley Buildathon, under my personal GitHub handle ALENZACODES. MIT licence.

### What I tested, and what testing changed

Three steps changed the build most:

1. A brute force check of every day from 2026 to 2029, 20,454 cases, found 1,650 failures and two real date errors (section 1 of `docs/TESTING.md`).
2. Reading the mail rule moved the main answer: mail counts on the fifth day after mailing, so the November 28 case moves a month.
3. Holidays: courier timing, the Canada Post calendar, and the January 1 deadline, where the safe literal date now leads.

Between those, seven rounds of written rubric review on 19 November 2026 each scored a written brief against the event criteria and listed fixes. The reviewers read the brief only; they did not run the page and they are not renters.

`npm test` has 28 date checks, 31 delivery, 55 courier, email and N9, 53 statutory service and N9, 40 closures, methods and limits, 60 deadline and rent, 91 literal deadline and closures, 44 safe headline and mailing day, and a separate oracle of 111,036 cases plus 64,284 headline checks, 1,461 courier hand offs and 4 holiday tables, all passing at v1.7.0. A browser check at desktop and phone width runs axe-core 4.14 under WCAG 2.2 AA and best practice rules in 16 page states with no violations. The live page, the source, Form N9, the statute and Board pages and the video link each returned HTTP 200 when checked on 19 November 2026. I also did a keyboard and accessibility tree self check. No screen reader software was used, and that check is not a screen reader test. No renter has used the page in a recorded session, and nothing here claims a user study.

### Video

https://youtu.be/AasmHYBD09k

The video was recorded at commit `2746fc3`, before every rubric review, and it is kept unchanged. It does not show the later calendar work, the practical send by day, the Canada Post holidays, the literal deadline line or the safe headline. The live page shows all of them; the GIF shows v1.6.0, the build before this one.

Erratum: the video's closing card calls 81,816 cases the first brute force run. The first run was 20,454 cases, with 1,650 failures. 81,816 is the number the fixed engine passed once four delivery methods were added.

## Built with

HTML, CSS, JavaScript. Playwright and axe-core as test tools only. Hosted on GitHub Pages.

## Try it

https://alenzacodes.github.io/lease-exit-timer/

Source: https://github.com/ALENZACODES/lease-exit-timer

## Gallery

1. `docs/screenshots/10-current-build.gif`: a silent 24 second capture of v1.6.0 doing one full task, made before the v1.7.0 wording changes. Open the page, type Saturday, November 28, 2026 and choose Canada Post: mail by Thursday, December 24, legal limit Sunday, December 27. Then the same end date by every method, then a courier hand off on Thursday, December 31: send by Friday, January 29, legal limit Sunday, January 31. Made by automated browser capture, no voice. A gallery image, not a new video.
2. `docs/screenshots/00-before-after.png`: the same November 28 mail input, generic 60 day count against this page (also the thumbnail)
3. `docs/screenshots/02-mail.png`: mail moves the end date a month, with the every method line and the rent estimate
4. `docs/screenshots/08-civic-holiday.png`: a weekday closure that changes the end date, marked UNKNOWN and said plainly
5. `docs/screenshots/09-service-chain.png`: how courier and email connect to the Act
6. `docs/screenshots/06-courier-holiday-n9.png`: courier moved past New Year's Day, with the Form N9 checklist
7. `docs/screenshots/01-home.png`: the page with a monthly result
8. `docs/screenshots/03-winter.png`: the February rule
9. `docs/screenshots/04-late-fixed.png`: a fixed term that is too late
10. `docs/screenshots/07-email-consent.png`: the two email consent boxes
11. `docs/screenshots/05-mobile.png`: phone layout

## Additional questions the form may ask

- **Problem or creative goal:** see "The problem" above.
- **Demo or visual walkthrough of the core feature:** the video above (recorded before every rubric review, with the erratum above), the current build GIF, and the live link.
- **What you built and tested:** see "What I tested, and what testing changed".
- **Eligibility:** the entrant, John Khan, is a current student, is above the age of majority in Ontario, Canada, where he lives, and entered solo. ALENZACODES is his personal GitHub handle, not a company or professional organization. The event window is November 8 to December 15, 2026. The project was built during it: the first commit, `e67f515`, is dated 9 November 2026, and version 1.7.0 is dated 19 November 2026.
- **Reused tools and assets:** none ship in the page. Test tools: Playwright, axe-core. Hosting: GitHub Pages.
- **Team member contributions:** John Khan, everything (solo).
