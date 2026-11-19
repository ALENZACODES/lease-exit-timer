# Self walkthrough of the page

This is a structured walkthrough I did myself, as the author, on 19 November 2026, America/Toronto. It is a heuristic review, not user testing. No renter or outside participant took part, and nothing here should be read as evidence of how real renters behave. Formal user testing is still to come.

## Method

I ran the page in Chromium at 1280 by 900 and at 390 by 844, using a scripted browser and screenshots, and worked through the tasks a renter would try first. At each step I noted anything that broke one of Jakob Nielsen's ten usability heuristics (for example match between the system and the real world, error prevention, and recognition rather than recall). Each problem got a severity from 1 (cosmetic) to 3 (could lead to a late notice).

Tasks:

1. Find the last day to give notice for a monthly tenancy, by hand.
2. Do the same by mail and by courier, and read when the notice counts.
3. Use the Form N9 checklist to fill in the form.
4. Check where the courier and email timing come from.
5. Enter a rent amount, including a wrong one.
6. Read the result on a phone sized screen.

## What it found and what changed

The Change column says what changed at the time. Rows 1, 4 and 5 end with a note where a later change replaced it.

| # | Task | Problem | Heuristic | Severity | Change |
| --- | --- | --- | --- | --- | --- |
| 1 | 2 | The last day to send could fall on a Sunday or a holiday. For a courier notice to end on 31 March 2027, the page said the last day was Sunday, 31 January 2027. The rule allows it, but many post offices and couriers do not pick up then, so a renter could plan for a day they cannot use. | Match between the system and the real world | 3 | For mail and courier, when the last day is a weekend or a statutory holiday the page now adds the last working day before it, for example "plan to send it by Friday, January 29, 2027". Tested. Update after the fourth outside review: the courier groups are now VERIFIED weekends and UNKNOWN weekday Board closures, counted as closed; see row 4. |
| 2 | 3 | In the Form N9 checklist, "Send it by" sat inside the numbered list of form fields, so it read like a field on the form. | Consistency and standards | 2 | The send by line is its own paragraph under the list. Each numbered item starts with its page number only. |
| 3 | 4 | The courier source text joined two quotes from rules 3.1 and 3.9 with a semicolon, so it read as one sentence of the rules. | Match between the system and the real world | 2 | Each quote is now its own quoted line with its own rule number, inside "How courier and email connect to the Act", which goes from RTA s. 191 (1) (g) to s. 2 (1) to rules 3.1, 3.5 and 3.9. |
| 4 | 2 | The courier list put New Year's Day, which is in the Legislation Act, next to Civic Holiday, which is not, with nothing to tell them apart. | Help users recognise and recover from errors | 2 | Skipped days are now grouped as weekends, statutory holidays, and assumed Board office closures. When an assumed closure is the only thing that moves the end date, the page says what the earlier date would be. Tested by an independent holiday table. Superseded: after the third outside review every skipped weekday became an assumed office closure, and after the fourth it is labelled UNKNOWN, counted as closed. There is no separate statutory holiday group any more. |
| 5 | 5 | Without a rent amount the page says one day late "can mean another month of rent", which is abstract. | Visibility of system status | 1 | An optional rent box adds "One day late costs about $X." It accepts $ and commas, and a wrong entry gets a plain message on the box. Nothing is sent anywhere. Superseded wording: the line now reads "Missing the last day by one day moves the end date by 1 month, about $X more rent", or 1 week or 1 day for weekly and daily tenancies, and says it is not a bill. |
| 6 | 1 | The first Tab stop, the examples and the result order read well. No problem found. | Recognition rather than recall | none | None. |
| 7 | 6 | At phone width the page has no sideways scroll and the result sits under the form. No problem found. | Flexibility and efficiency of use | none | None. |
| 8 | 3 | The page cannot fill in Form N9 for the user, so they still copy the date across by hand. | Error prevention | 1 | Not changed. Filling and signing a legal form is out of scope. The checklist writes the termination date as dd/mm/yyyy so it can be copied exactly. |

## What this does not show

A self walkthrough finds the problems the author can see. It does not show whether a renter trusts the date, understands the difference between the day notice counts and the day to send it, or reads the courier and email caveats. Those are the first questions for the user testing that is still to come.
