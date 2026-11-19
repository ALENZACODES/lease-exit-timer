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

Form N9 mailed on Saturday, November 28, 2026: a generic "60 days from today" count lands on January 27, 2027, so January 31 looks fine. This page counts the notice on December 3, which leaves 59 days, so the earliest end is February 28, 2027, and the last day to mail for January 31 was November 27. The decision is a practical send by day: "Send Form N9 by Canada Post by Thursday, December 24, 2026 to end your tenancy on February 28, 2027." Under it is the legal limit, Monday, December 28, 2026. Canada Post is closed that day (Boxing Day observed). Mailing on December 24 still reaches February 28; mailing on December 29 misses it.

### What it does

Enter the send day, the kind of tenancy, the rent day (with a note to check the rental period in the lease), and how the notice will reach the landlord: by hand or mail box, Canada Post, courier, or email with written consent. Optionally add the rent, to show what one late day would cost.

The result opens with the practical send by day and the end date. When that day is earlier than the legal limit, the legal limit sits under the sentence. Then come the last day for every method, a short timeline, and a "Why this date" section. Mail uses its own Canada Post closure calendar, taken from the official holiday schedule (read 19 November 2026, America/Toronto): in this window, December 25, December 28 (Boxing Day observed) and January 1. Courier still uses weekends, Legislation Act s. 88 holidays and Civic Holiday. December 28 is not skipped for courier unless the Board is confirmed closed. Weekday Board closures are labelled UNKNOWN. Deadline extensions quote Legislation Act s. 89 (1) ("Time limits that would otherwise expire on a holiday are extended to include the next day that is not a holiday") and s. 87, and are labelled as the author's reading, not an adjudicated result.

A Form N9 checklist and the sources sit beside the result. Nothing typed leaves the browser.

### How I built it

Plain HTML, CSS and JavaScript. The date engine in `site/dates.js` is shared by the page and the tests. Penn Blue #011F5B and Penn Red #990000. Built by John Khan, Toronto, Ontario, a current student, solo, for the Silicon Valley Buildathon. MIT licence.

### What I tested, and what testing changed

`npm test` has 27 date checks, 31 delivery, 55 courier, email and N9, 53 statutory service and N9, 40 closures, methods and limits, 59 deadline and rent, and a separate oracle of 111,036 cases plus 1,461 courier hand offs and 4 holiday tables, all passing. The test files are named by feature. A browser check runs axe-core under WCAG 2.2 AA rules and tests every published link. Formal user testing has not been done. A keyboard and screen reader pass is in `docs/TESTING.md`, labelled as a self check, not a user study.

### Video

https://youtu.be/AasmHYBD09k

The video predates every outside review. It does not show the later calendar work, the practical send by day, or the Canada Post closures. The live page, the screenshots and the GIF do. The video and its YouTube link are unchanged. No new video was recorded.

## Built with

HTML, CSS, JavaScript. Playwright and axe-core as test tools only. Hosted on GitHub Pages.

## Try it

https://alenzacodes.github.io/lease-exit-timer/

Source: https://github.com/ALENZACODES/lease-exit-timer

## Gallery

1. `docs/screenshots/10-current-build.gif`: silent before, failure, fix capture of the November 28 mail boundary and the courier holiday correction. A generic 60 day count from November 28 makes January 31 look fine; mail is deemed served on December 3, so January 31 is already lost; the page now says mail by Thursday, December 24, with the legal limit Monday, December 28, when Canada Post is closed for Boxing Day observed; then courier, where Sunday, January 31 is the legal limit and Friday, January 29 is the practical send by day. Made by automated browser capture, no voice. A gallery image, not a new video.
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
- **Demo or visual walkthrough of the core feature:** the video above, plus the live link. The video predates every outside review.
- **What you built and tested:** see "What I tested, and what testing changed".
- **Eligibility:** the entrant, John Khan, is a current student.
- **Reused tools and assets:** none ship in the page. Test tools: Playwright, axe-core. Hosting: GitHub Pages.
- **Team member contributions:** John Khan, everything (solo).
