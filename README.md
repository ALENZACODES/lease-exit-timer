# Lease Exit Timer

**Live:** https://alenzacodes.github.io/lease-exit-timer/

Find the last day to give ordinary tenant notice in Ontario, with delivery time counted, and see the public rule behind every date.

![Lease Exit Timer showing a monthly tenancy that ends on January 31, 2027](docs/screenshots/01-home.png)

## The problem

Ending a lease in Ontario usually takes 60 days of notice on official Form N9, ending on the last day of a rental period. The hard part is the calendar. One late day can mean another month of rent, and two rules catch people out:

- Mail counts on the **fifth day after mailing**, not the day it is posted (Residential Tenancies Act, s. 191 (3)).
- Notice for the end of February or March has its **own short rule** (s. 44 (5)).

## What it does

1. Enter the day you will send or give notice, the kind of tenancy, and the rent day.
2. Pick how it will reach the landlord: by hand or mail box, Canada Post, courier, or email with written consent.
3. Get the earliest ordinary end date, the last day to send notice that way, and a short timeline that shows the count.
4. Save the last day to your calendar with a one week reminder, print the plan, or copy a courtesy note.

Four example buttons show the main cases in one click: an ordinary monthly notice, mail moving the date a month, the February rule, and a fixed term that is already too late.

## What it will not do

It is not legal advice and it does not file, send or sign anything. Special paths on the N9 instructions (a refused assignment, an N12 or N13, care homes, the standard lease demand, and notice for tenants who have experienced violence) are listed and not dated, because they need facts the page does not ask for. Nothing you type leaves the browser.

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
- `tests/test_property.mjs` checks 81,816 cases from 2026 to 2029: every answer must be a real period end, must be legal, and must be the earliest legal day.
- `tests/browser_check.py` runs the page in Chromium at desktop and phone width with axe-core.

[docs/TESTING.md](docs/TESTING.md) explains what the tests found and what changed because of them.

## How it is built

- `site/dates.js` is the date engine: pure functions, shared by the browser and the Node tests.
- `site/data/rules.json` holds the rule text and source list shown on the page.
- `site/app.js` and `site/index.html` are the interface. Plain HTML, CSS and JavaScript, no framework, no tracking.
- GitHub Actions runs `npm test` and publishes `site/` to GitHub Pages.

## Sources

Read on 19 November 2026, America/Toronto.

- Residential Tenancies Act, 2006, S.O. 2006, c. 17, ss. 38, 44, 47 and 191: https://www.ontario.ca/laws/statute/06r17
- Legislation Act, 2006, S.O. 2006, c. 21, Sched. F, s. 89 (3): https://www.ontario.ca/laws/statute/06l21
- Form N9, Tenant's Notice to End the Tenancy (v. 01/04/2022): https://tribunalsontario.ca/documents/ltb/Notices%20of%20Termination%20%26%20Instructions/N9.pdf
- Landlord and Tenant Board Rules of Procedure, rules 3.1 and 3.9: https://tribunalsontario.ca/documents/ltb/Rules/LTB-Rules_of_Procedure.html
- A guide to the standard lease for rental housing: https://files.ontario.ca/mmah-guide-to-standard-lease-for-rental-housing-en-2022-04-19.pdf

## Credits

Built by John Khan, Toronto, Ontario, for Silicon Valley Buildathon. Solo project. Reused parts: none beyond the browser platform. The accessibility check uses axe-core and Playwright as test tools only; neither ships in the page.

## License

MIT. See [LICENSE](LICENSE).
