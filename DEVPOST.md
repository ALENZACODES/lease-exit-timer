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

In Ontario, ending a monthly lease usually takes at least 60 days of notice on official Form N9, ending on the last day of a rental period. The rule sounds simple. The calendar is not. Two details catch people out. Notice sent by mail counts on the fifth day after mailing, not the day it goes in the post. And notice for the end of February or March has its own short rule. Miss the real last day by one day and the tenancy runs another month.

### What is different

Take one input: Form N9 mailed on Saturday, November 28, 2026. A generic "60 days from today" count lands on January 27, 2027, so it says the January 31 period end works. Lease Exit Timer counts the notice on December 3, five days after mailing under s. 191 (3), which leaves 59 days, so the earliest end is February 28, 2027, and it says the last day to mail for January 31 was November 27. It starts from the end date and counts backward through the way the notice will actually be delivered, skips the days the rules skip, extends a deadline that falls on a holiday the way the Legislation Act does, and shows the same end date for every method. The answer is one sentence: "Send Form N9 by Canada Post by December 28, 2026 to end your tenancy on February 28, 2027."

### What it does

Lease Exit Timer asks for:

1. the day you will send or give notice,
2. the kind of tenancy (monthly, fixed term, weekly or daily),
3. the rent day (or the weekday rent is paid, for a weekly tenancy), with a note to check the rental period in the lease, because the day you usually pay is not always proof of it,
4. for a fixed term only, the last day of the term as written in the lease, with a worked example beside the box,
5. how the notice will reach the landlord: by hand or mail box, Canada Post, courier, or email,
6. optionally, the rent, to show what one late day would cost.

It returns, in this order:

- **the decision, in one sentence**, for example "Send Form N9 by courier by January 31, 2027 to end your tenancy on March 31, 2027",
- the earliest ordinary end date, the last day to send by the method you picked (and, when that day is a weekend or holiday for mail or courier, the last working day before it), and a short timeline from the send day to the day notice counts to the end date,
- the same end date by every method in one line, for example "To end on January 31, 2027, the last day to send is: By hand or mail box December 2, 2026; Canada Post November 27, 2026; Courier December 1, 2026; Email, with written consent December 2, 2026",
- a **"Why this date"** section: why notice counts on that day, which notice period applies, any holiday extension of the January 1 or February 1 deadline, and for courier the exact days the count moved past, with Saturdays and Sundays labelled VERIFIED and weekday Board closures labelled UNKNOWN and counted as closed, plus the date if the offices were open,
- with a rent amount, how far one day late moves the end date in the tenancy's own unit (a month, a week or a day) and about what that costs, as an estimate, not a bill,
- a Form N9 checklist: every field the tenant or representative must complete on the official form, in order (the Office Use Only box is for the Board), with the termination date written as dd/mm/yyyy,
- a calendar file with a reminder one week before the last send day, a printable plan, and an optional courtesy note that says plainly it is not Form N9.

The fixed term end date is checked before anything is counted. An empty box, an impossible date, a date more than ten years out, or a term that has already ended each get a plain message and the box is marked. An end date that is not the day before a rent day gets a note to check the lease. A fixed term that is already too late is flagged in red, with the next ordinary monthly date to check under s. 38 (1).

Email is accepted only when the user ticks two boxes: the landlord agreed in writing to service by email (LTB rule 3.5), and that written consent covers a tenant's notice to end the tenancy. The Board's own Consent to Service by Email form lists rent increase notices, landlord entry notices, documents for a Board application and tenancy communication, and does not name a tenant's notice to end the tenancy, so the page asks the user to check. It then reminds them to include their name and phone number, attach the signed form, and keep a copy of the sent email and the consent. Special paths from the N9 instructions are listed, not dated, because they need facts the page does not ask for. Five example buttons show the main cases in one click, including a courier hand off on New Year's Eve. Nothing typed leaves the browser.

### How I built it

Plain HTML, CSS and JavaScript with no framework and no tracking. The date engine is a set of pure functions in `site/dates.js`, shared by the page and the Node tests. Rule text and sources live in `site/data/rules.json`. GitHub Actions runs the tests and publishes the page to GitHub Pages.

The rules come from the Residential Tenancies Act, 2006 (section 38 on fixed terms, section 44 on notice periods, section 47, which lets a tenant end a tenancy at the end of a period or term by notice under section 44, and section 191 on delivery), the Legislation Act, 2006 (section 88, the list of Ontario holidays, and section 89 (3), how days are counted), the official Form N9 and its instructions, the Board's Consent to Service by Email form, and rules 1.1, 3.1, 3.5, 3.6 and 3.9 of the Landlord and Tenant Board Rules of Procedure. All of them are linked in the sources section of the page, and each step in "How it counts" links to its rule. A section called "How courier and email connect to the Act" shows the chain: RTA s. 191 (1) (g) allows service "by any other means allowed in the Rules", s. 2 (1) defines the Rules as the Board's rules of practice and procedure, rule 3.1 adds courier, and email with written consent under rule 3.5, and rule 3.9 says when each counts.

Courier timing follows rule 3.9: the day after hand off, or if that day is a holiday, the next day that is not. Rule 1.1 defines a holiday as any Saturday, Sunday or other day the Board's offices are closed. The engine computes the Legislation Act s. 88 holidays for any year: New Year's Day, Family Day, Good Friday, Easter Monday, Victoria Day, Canada Day (July 2 when July 1 is a Sunday), Labour Day, Thanksgiving, Remembrance Day, Christmas Day and Boxing Day, plus the extra days in s. 88 (3), (4) and (5): when New Year's Day falls on a Sunday the Monday after is also a holiday; when July 1 is a Sunday, Canada Day is July 2; when Christmas Day falls on a Saturday the Monday after is also a holiday, and when it falls on a Sunday the Tuesday after is. A New Year's Day on a Saturday, such as January 1, 2028, adds nothing. Civic Holiday is not on the s. 88 list.

Rule 1.1 does not use the s. 88 list. It counts a weekday as a holiday only if the Board's offices are closed, and I could not find a Board closure calendar. So the page labels every weekday it skips, the s. 88 holidays and Civic Holiday alike, UNKNOWN and counts it as closed, and labels Saturdays and Sundays VERIFIED, because rule 1.1 names them. Counting an UNKNOWN day as closed can only make the advised send day earlier. When an assumption changes the end date, the page says what the date would be if the offices were open: for a courier hand off on December 31, 2026, February 28, 2027 instead of March 31.

The s. 44 (5) deadlines are fixed dates, January 1 and February 1, and January 1 is always a holiday. Legislation Act s. 89 (1) says a time limit that would otherwise expire on a holiday is extended to include the next day that is not a holiday, and s. 88 does not list Saturday. So notice given by hand on Saturday, January 2, 2027 still reaches February 28, 2027, and mail sent on Monday, December 28, 2026 counts on that Saturday. In 2028 the extension runs to Monday, January 3, and in 2034, when January 1 is a Sunday and January 2 is also a holiday, to Tuesday, January 3. A February 1 on a Sunday, as in 2026, runs to the Monday. LTB rule 1.14, through RTA s. 193, could be read to reach the next weekday, because the Board also treats Saturdays as holidays; the page names that later day and does not rely on it. The 60 and 28 day minimum periods are not extended, because they are minimum notice periods rather than time limits that expire. That is my reading, and the page says so.

### What I tested, and what testing changed

The first version passed all 27 of its hand written checks. Then I added a brute force check that walks every day from 2026 to 2029 and asks three questions of each answer: is it a real period end, is it legal, and is there any earlier legal day? The first version only knew hand delivery, so that first run covered hand delivery only: 20,454 cases (1,461 days times seven monthly rent days and seven weekly pay days). It found 1,650 failures.

- Rent due on the 29th, 30th or 31st picked the wrong period end in shorter months (1,647 cases). The engine now finds the due date in each month first, then steps back a day.
- Notice given on December 31 skipped the end of February the next year, even though section 44 (5) allows it (3 cases). The engine now checks every period end in order against both rules.

Reading section 191 (3) changed the main answer, and it is the clearest before and after in the project. The first version treated the send day as the day notice counts. Before: someone mailing on Saturday, November 28, 2026 for a January 31, 2027 move was told they were fine. (Mail counts five calendar days later; s. 191 (3) has no weekend adjustment.) After: the page says mail sent that day counts on December 3, which leaves 59 days, so the earliest end moves to February 28, 2027, and the last day to mail for January 31 is November 27. Delivery method is now an input, and the result shows the last send day for that method.

The first round of outside review found a gap in the courier rule. It skipped weekends but not holidays. A courier hand off on December 31, 2026 was counted on January 1, 2027, which is New Year's Day, so the page said February 28 was reachable under the s. 44 (5) winter rule. With holidays counted, that notice counts on Monday, January 4, the winter rule no longer applies, and the earliest end is March 31. The last courier day for February 28 is December 30. That case is now a regression test and one of the example buttons.

The second round of outside review pointed out that the brute force check got its holidays from the same engine it was testing. It is now an oracle with its own hard coded 2026 to 2029 holiday table and its own date maths. It imports only the two engine functions it tests, compute() and holidaysIn(), and it covers daily tenancies and fixed terms too. The code is independent; the reading of the law is not, because I typed the table from the same reading of s. 88 and rules 1.1 and 3.9, so a shared misreading would pass both. To make sure the oracle can fail, I removed one holiday from its table (65 failures) and changed its mail lag to four days (27,759 failures), then put both back.

The third round of outside review pointed out that rule 1.1 turns on whether the Board's offices are closed, not on the s. 88 list, and that my description of the s. 88 weekend rules was too broad. The engine was already right about the weekend rules (January 1, 2028 is a Saturday and adds no Monday; July 1, 2029 is a Sunday and Canada Day moves to July 2), and both are now tested. The labels were not: every weekday the page skips is now labelled UNKNOWN and counted as closed, and the page says what the date would be if the offices were open.

The fourth round asked for the holiday extension of the s. 44 (5) deadlines to be resolved rather than avoided. Applying s. 89 (1) moved three of the original hand written expectations: the last notice day for February 28, 2027 is now January 2, not January 1, and notice on January 2 now reaches February 28 rather than March 31. Those checks were changed with a comment citing s. 89 (1), the oracle got its own reading of the extension, and a new file tests the extension for 2026, 2027, 2028, 2029 and 2034, the closure labels, and the rent estimate for weekly and daily tenancies, which was already counted in weeks and days but had no test.

The current build passes 27 original checks, 31 delivery and edge case checks, 55 checks for the holiday, email, fixed term and Form N9 changes, 52 checks for the round 3 changes, 40 checks for the third review's changes (the weekend rules for 2028 and 2029, closures, the every method line, the rent estimate and the rental period note), 43 checks for the holiday extension, the closure labels, the decision sentence and the rent estimate by period unit, and 111,036 brute force cases against the oracle (every send day from 2026 to 2029, four delivery methods, monthly, weekly, daily and fixed term tenancies), plus 1,461 courier hand offs (skipped days and their kinds, the date if the offices were open, and the every method line) and the four yearly holiday tables. A browser check runs the page in Chromium at desktop and phone width, runs the five examples, confirms the skip link, refuses email until both consent boxes are ticked, checks the decision sentence, the deadline extension note, the fixed term error, the rent box, a weekly rent case, the every method line and a Civic Holiday case, checks for sideways scroll, and runs axe-core 4.14 with WCAG 2.2 AA and best practice rules. On November 19, 2026, against the published page, it reported zero violations. An automated check is not a full accessibility audit. Details are in `docs/TESTING.md` in the repository.

Formal user testing with renters is still to come. Nothing in this entry claims a user study. What I did instead, and label as such, is a structured self walkthrough against usability heuristics (`docs/WALKTHROUGH.md`). It found a last send day that fell on a Sunday, a "Send it by" line that read like a form field, two rule quotes joined into one, and statutory holidays mixed with an assumed closure. All four are fixed and tested. It is a self review, not user testing.

### Challenges

Counting days the way the law counts them, then counting backwards from a deadline through a delivery method. Deciding what not to automate: the page names special cases instead of guessing their dates.

### What I learned

The useful product is a date you can act on and the official form, not a longer letter. Saying plainly what a tool cannot date is part of the feature.

### What's next

Formal sessions with renters to see where they hesitate, a yearly tenancy option, and a French version.

### Limits, said plainly

Not legal advice. It does not file, send or sign anything. Special N9 paths are listed and not dated. Yearly tenancies are not offered. Courier and email timing rest on the Board's Rules of Procedure, which the Act brings in through s. 191 (1) (g) ("any other means allowed in the Rules") but which are written mainly for Board matters, so the page says so. A day fixed as a holiday by proclamation, or an unplanned office closure, cannot be known ahead. The January 1 and February 1 deadlines are extended under Legislation Act s. 89 (1); the further day LTB rule 1.14 might allow is named and not relied on, and the minimum periods are not extended. That is the page's reading of how those provisions fit together, not a ruling. Under s. 191 (2) a notice that actually reached the landlord in time can still count; the page treats that as a fallback, not a plan.

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

### What the video shows, and what it does not

The video was recorded at commit 2746fc3 on November 19, 2026, after my own second pass and before any outside review. It will not be re-recorded for this entry. The gallery and the live page show what came after.

The video shows: a monthly notice by hand (January 31, 2027, last day December 2, 2026) with the count step by step; mail on November 28, 2026 moving the end to February 28, 2027, against hand delivery that still reaches January 31; email refused until the user confirms the landlord agreed in writing; the February rule; a fixed term that is too late, flagged in red with the next monthly date; the calendar file and print view; the rules section; and a closing card with a brute force run (81,816 cases, two date errors found and fixed) and an axe-core result of zero issues.

One figure on the closing card is out of order. It calls 81,816 cases the first brute force run. The first run, against the hand delivery only version, was 20,454 cases and found the 1,650 failures; 81,816 is the run after the fix, the same 20,454 cases for each of four delivery methods. `docs/TESTING.md` section 1 has the right order. The video is not being re-recorded, so this line corrects it here.

The video does not show anything added after 2746fc3: Ontario holidays in courier timing and the New Year's Eve courier example, the second email tick (that the consent covers this notice), the Form N9 checklist, fixed term end date checks, the rent line, the "Same end date, every method" line, the rental period note, the service chain to the LTB Rules, the weekday closure labels and the note when a closure changes the date, the last working send day, the decision sentence and "Why this date", the holiday extension of the January 1 deadline, or the independent oracle (111,036 cases). Gallery item 2, a silent 18 second capture of the current build, and items 3 to 5 cover the most important of these. The capture is a gallery image, not a new video.

## Image gallery

1. `docs/screenshots/00-before-after.png`: the same input in the first version (commit e67f515) and now. A generic 60 day count from Saturday, November 28, 2026 lands on January 27, 2027, and the first version also said January 31 works; now mail counts on December 3 and the end is February 28, 2027 (also the thumbnail)
2. `docs/screenshots/10-current-build.gif`: a silent 18 second capture of the current build, made by automated browser capture: the December 31, 2026 courier case with the decision sentence, the same end date for every method, New Year's Day as an UNKNOWN Board closure counted as closed, the February 28 date if the offices were open, and the January 1 deadline extended to January 2 for mail sent November 28
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
- **Demo or visual walkthrough of the core feature:** the video above, plus the live link.
- **What you built and tested:** see "What I tested, and what testing changed".
- **Eligibility:** the entrant, John Khan, is a current student.
- **Reused tools and assets:** none ship in the page. Test tools: Playwright, axe-core. Hosting: GitHub Pages.
- **Team member contributions:** John Khan, everything (solo).
