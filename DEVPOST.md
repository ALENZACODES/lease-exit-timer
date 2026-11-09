# Devpost copy · Lease Exit Timer · Silicon Valley Buildathon

## Tagline
Count the last ordinary move-out notice day under Ontario’s public tenancy rules.

## Inspiration
When a lease is ending, the hard part is not writing a sentence. It is knowing which calendar day still counts as enough notice, especially in February and March, and remembering that the official form is N9, not an email. I wanted a small workbench tool that does that counting in the open, with the public sources next to the result.

## What it does
Lease Exit Timer asks for the day you can give notice and the kind of tenancy you have: monthly, weekly, daily, or a fixed term. It returns the earliest ordinary termination date the published rules support, and the last day to give notice for that date. It also drafts a short courtesy note you can paste while you fill official Form N9. A fixed term that is already inside the 60-day window is flagged instead of inventing an earlier exit. Special cases listed on the official form, such as a refused assignment or an N12 or N13 from the landlord, are named and left undated.

## How we built it
Static HTML, CSS and JavaScript. Notice periods live in `data/rules.json` and in a small date module with unit tests. The periods come from the official N9 instructions and the standard lease guide, both retrieved on 9 November 2026 in America/Toronto (HTTP 200), and are cited against the Residential Tenancies Act, 2006. The visual style uses Penn Blue and Penn Red on white.

## Challenges we ran into
Counting "at least 60 days" on a calendar without slipping a day. Applying the February and March rule only when the termination date is the last day of those months, and only when the 60-day count is not already enough. Refusing to automate paths that need facts the form does not ask for.

## Accomplishments that we're proud of
A working date count on real public rules. Tests for ordinary months, the special winter dates, a leap-year February, weekly periods, and a late fixed term. A draft note that points people to Form N9 instead of pretending to be that form.

## What we learned
The useful product is the date and the official form, not a longer letter. When a tool cannot date a special path, saying so is part of the feature.

## What's next
A print view that lists the N9 fields beside the calculated date. More tests around unusual rent-due days. Still no attempt to replace the Board form or to date paths that need extra facts.

## Built with
HTML, CSS, JavaScript, public Ontario statute and Tribunal form pages

## Try it
Local: `python3 -m http.server 8080 --directory site` then open the site.
