# Devpost submission draft · Lease Exit Timer · Silicon Valley Buildathon

Draft only. Not submitted and no Devpost project page has been created.

## Project name

Lease Exit Timer

## Elevator pitch (200 characters max)

Know the last day to give Ontario tenant notice, with mail and courier time counted, so one late day does not cost another month of rent. Every date links to the public rule.

## Thumbnail (3:2)

`docs/screenshots/thumbnail-3x2.png`

## About the project

### The problem

In Ontario, ending a monthly lease usually takes at least 60 days of notice on official Form N9, ending on the last day of a rental period. The rule sounds simple. The calendar is not. Two details catch people out. Notice sent by mail counts on the fifth day after mailing, not the day it goes in the post. And notice for the end of February or March has its own short rule. Miss the real last day by one day and the tenancy runs another month.

### What it does

Lease Exit Timer asks four things: the day you will send or give notice, the kind of tenancy, the rent day, and how the notice will reach the landlord (by hand or mail box, Canada Post, courier, or email with written consent). It returns:

- the earliest ordinary end date,
- the last day to send notice by the method you picked,
- a short timeline that shows the count, from the send day to the day notice counts to the end date,
- a calendar file with a reminder one week before the last send day, a printable plan, and an optional courtesy note that points to Form N9.

A fixed term that is already too late is flagged in red, with the next ordinary monthly date to check. Special paths from the N9 instructions are listed, not dated, because they need facts the page does not ask for. Four example buttons show the main cases in one click. Nothing typed leaves the browser.

### How I built it

Plain HTML, CSS and JavaScript with no framework and no tracking. The date engine is a set of pure functions in `site/dates.js`, shared by the page and the Node tests. Rule text and sources live in `site/data/rules.json`. GitHub Actions runs the tests and publishes the page to GitHub Pages.

The rules come from the Residential Tenancies Act, 2006 (sections 38, 44 and 191), the Legislation Act, 2006 (section 89 (3), how days are counted), the official Form N9 instructions, and rules 3.1 and 3.9 of the Landlord and Tenant Board Rules of Procedure. Each is linked on the page.

### What I tested, and what testing changed

The first version passed all 27 of its hand written checks. Then I added a brute force check that walks every day from 2026 to 2029, for four delivery methods, seven rent days and every weekly pay day, and asks three questions of each answer: is it a real period end, is it legal, and is there any earlier legal day? It found 1,650 failures in the first version.

- Rent due on the 29th, 30th or 31st picked the wrong period end in shorter months (1,647 cases). The engine now finds the due date in each month first, then steps back a day.
- Notice given on December 31 skipped the end of February the next year, even though section 44 (5) allows it (3 cases). The engine now checks every period end in order against both rules.

Reading section 191 (3) changed the main answer. The first version treated the send day as the day notice counts. Someone mailing on November 28, 2026 for a January 31, 2027 move would have been told they were fine, and their notice would have counted one day too late. Delivery method is now an input, and the result shows the last send day for that method.

The current build passes 27 original checks, 31 delivery and edge case checks, and 81,816 brute force cases. A browser check runs the page in Chromium at desktop and phone width, confirms the skip link, refuses email without consent, checks for sideways scroll, and runs axe-core with WCAG 2.2 AA rules: zero violations. Details are in `docs/TESTING.md` in the repository.

### Challenges

Counting days the way the law counts them, then counting backwards from a deadline through a delivery method. Deciding what not to automate: the page names special cases instead of guessing their dates.

### What I learned

The useful product is a date you can act on and the official form, not a longer letter. Saying plainly what a tool cannot date is part of the feature.

### What's next

Ontario public holidays for the courier rule, a printable list of the N9 fields beside the date, and a short session with renters to see where they hesitate.

### Team and reused components

Solo project by John Khan, Toronto, Ontario. No third party code ships in the page. Playwright and axe-core were used as test tools only.

## Built with

html, css, javascript, node.js, github-pages, github-actions, playwright, axe-core

## Try it out links

- Live demo: https://alenzacodes.github.io/lease-exit-timer/
- Source code and tests: https://github.com/ALENZACODES/lease-exit-timer
- What testing changed: https://github.com/ALENZACODES/lease-exit-timer/blob/main/docs/TESTING.md

## Video demo link

Silent walkthrough, 1 minute 29 seconds, captions on screen, no voice: `docs/demo/lease-exit-timer-walkthrough.mp4` in the repository.
Devpost needs a YouTube, Vimeo or Facebook link here. Upload it unlisted first, then paste the link. Not uploaded yet.

## Image gallery

1. `docs/screenshots/01-home.png` · the page with a monthly result
2. `docs/screenshots/02-mail.png` · mail moves the end date a month
3. `docs/screenshots/03-winter.png` · the February rule
4. `docs/screenshots/04-late-fixed.png` · a fixed term that is too late
5. `docs/screenshots/05-mobile.png` · phone layout

## Additional questions the form may ask

- **Problem or creative goal:** see "The problem" above.
- **Demo or visual walkthrough of the core feature:** the video above, plus the live link.
- **What you built and tested:** see "What I tested, and what testing changed".
- **Reused tools and assets:** none ship in the page. Test tools: Playwright, axe-core. Hosting: GitHub Pages.
- **Team member contributions:** John Khan, everything (solo).
