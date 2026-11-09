# Lease Exit Timer

Count ordinary Ontario tenant notice dates and draft a short courtesy note.

The page uses published notice periods from the Residential Tenancies Act, 2006, as also printed on official Form N9 and in the provincial standard lease guide. You enter the day you can give notice and the kind of tenancy you have. The page returns the earliest ordinary termination date it can support, the last day to give notice for that date, and a copy-paste note. The note is not a substitute for Form N9.

Built for Silicon Valley Buildathon (solo entry by John Khan, Toronto, Ontario).

## Features

- Monthly, weekly, daily, and fixed-term paths
- The official February and March short-notice rule when it applies
- Last day to give ordinary notice for the dated termination
- Draft note with landlord, tenant, unit, and date fields
- Clear list of official exceptions the page does not try to date
- No accounts and no invented periods

## Run locally

From this folder:

```bash
python3 -m http.server 8080 --directory site
```

Open http://localhost:8080/.

## Tests

```bash
node tests/test_dates.mjs
```

Checks worked examples, including 9 November 2026 to 31 January 2027 for a monthly tenancy with rent due on the 1st, the January 1 and February 1 special dates, a leap-year February, a late fixed term, and a weekly period ending on Sunday.

## Data sources

- Residential Tenancies Act, 2006, S.O. 2006, c. 17: https://www.ontario.ca/laws/statute/06r17
- Landlord and Tenant Board Form N9 (v. 01/04/2022): https://tribunalsontario.ca/documents/ltb/Notices%20of%20Termination%20%26%20Instructions/N9.pdf
- A guide to the standard lease for rental housing, part D: https://files.ontario.ca/mmah-guide-to-standard-lease-for-rental-housing-en-2022-04-19.pdf

The two PDFs returned HTTP 200 on 9 November 2026, America/Toronto. The e-Laws statute page is cited as the official Act. The day counts used in the code were taken from the N9 instructions, which quote the same 60-day, 28-day, period-end, fixed-term, and February or March rules.

This page is not legal advice and does not file a notice.

## Stack

HTML, CSS and JavaScript. No build step. Penn Blue `#011F5B` and Penn Red `#990000` on white.

## License

MIT. See `LICENSE`.
