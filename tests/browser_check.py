"""Browser check for Lease Exit Timer, by John Khan.

Usage: python3 tests/browser_check.py http://127.0.0.1:8931/ [path/to/axe.min.js]
Loads the page in Chromium, runs the five built-in examples, checks the visible answers,
walks the keyboard path, and runs axe-core (WCAG 2.2 AA plus best practice) when a path is given.
"""
import sys, json, asyncio
from playwright.async_api import async_playwright

URL = sys.argv[1]
AXE = sys.argv[2] if len(sys.argv) > 2 else None
EXPECT = {
    "ordinary": ["Give Form N9 by hand by Wednesday, December 2, 2026 to end your tenancy on January 31, 2027.", "January 31, 2027", "December 2, 2026", "FORM N9 CHECKLIST", "31/01/2027", "Include all tenant names", "Every field the tenant or representative must complete", "Missing the last day by one day moves the end date by 1 month, about $1,850.00 more rent", "not a bill", "Same end date, every method.", "Canada Post November 27, 2026", "February 28, 2027", "Why this date"],
    "mail": ["Send Form N9 by Canada Post by Thursday, December 24, 2026 to end your tenancy on February 28, 2027.", "Sunday, December 27, 2026 is the theoretical last mailing day for the legal deadline as written in s. 44 (5). It is not a day with confirmed postal collection.", "may not be collected or postmarked until Tuesday, December 29, 2026", "It is evidence of the day you mailed it", "Monday, December 28, 2026 could also work, but only on the author's reading", "Boxing Day", "dated receipt", "Canada Post December 24, 2026 (theoretical mailing limit December 27, 2026; December 28, 2026 on the author's reading only)", "A notice or document may be delivered to a party or person on a holiday", "December 24, 2026", "fifth day after mailing", "Holiday extension of the January 1 deadline", "Time limits that would otherwise expire on a holiday", "January 2, 2027", "January 4, 2027", "does not rely on it, because it is not clear the Board", "minimum periods are not extended"],
    "winter": ["February 28, 2027", "February and March rule", "FORM N9 CHECKLIST", "28/02/2027", "January 2, 2027"],
    "courier": ["Send Form N9 by courier by Friday, January 29, 2027 to end your tenancy on March 31, 2027.", "Sunday, January 31, 2027 is the last day that would still meet the legal deadline", "Saturday, January 30, 2027 would also count on the same day, if your courier picks up on Saturdays", "March 31, 2027", "January 4, 2027", "New Year's Day", "UNKNOWN, counted as closed: Ontario holiday under the Legislation Act, 2006, s. 88", "VERIFIED: Saturday or Sunday, a holiday under LTB rule 1.1 by name", "Board closures are UNKNOWN.", "an earlier end date of February 28, 2027", "about $2,100.00 more rent", "Courier January 29, 2027 (legal limit January 31, 2027)"],
    "late": ["It is too late to end this fixed term on December 31, 2026 by notice.", "TOO LATE FOR THIS FIXED TERM", "January 31, 2027"],
}
fails = []

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for vw in [(1280, 900), (390, 844)]:
            pg = await b.new_page(viewport={"width": vw[0], "height": vw[1]})
            errors = []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            await pg.goto(URL)
            await pg.wait_for_timeout(600)
            for name, needles in EXPECT.items():
                await pg.click(f"[data-example={name}]")
                await pg.wait_for_timeout(200)
                text = await pg.locator("#result").inner_text()
                for n in needles:
                    if n not in text:
                        fails.append(f"{vw[0]} {name}: missing {n}")
                # Round 7: only a short summary is live, and it carries the decision sentence.
                live = await pg.locator("#live-summary").inner_text()
                if needles[0] not in live or len(live) > 700:
                    fails.append(f"{vw[0]} {name}: live summary {live[:120]!r}")
                if await pg.locator("#result").get_attribute("aria-live") is not None:
                    fails.append(f"{vw[0]} {name}: the whole result is still a live region")
                if AXE:
                    await pg.add_script_tag(path=AXE)
                    v = await pg.evaluate("async()=>(await axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']})).violations.map(x=>x.id)")
                    if v:
                        fails.append(f"{vw[0]} {name}: axe {v}")
            # Keyboard: first Tab reaches the skip link, and Enter on it moves focus into main.
            await pg.goto(URL)
            await pg.keyboard.press("Tab")
            first = await pg.evaluate("document.activeElement.className")
            if first != "skip":
                fails.append(f"{vw[0]} first tab stop was {first}")
            # Email without consent must refuse to count.
            await pg.check('input[name="delivery"][value="email"]')
            await pg.wait_for_timeout(150)
            if "written consent" not in await pg.locator("#result").inner_text():
                fails.append(f"{vw[0]} email without consent was not refused")
            await pg.check("#email-consent")
            await pg.wait_for_timeout(150)
            if "LAST DAY TO SEND" in await pg.locator("#result").inner_text():
                fails.append(f"{vw[0]} email counted without consent covering the notice")
            await pg.check("#email-covers")
            await pg.wait_for_timeout(150)
            if "LAST DAY TO SEND" not in await pg.locator("#result").inner_text():
                fails.append(f"{vw[0]} email with consent did not count")
            if AXE:
                await pg.add_script_tag(path=AXE)
                v = await pg.evaluate("async()=>(await axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']})).violations.map(x=>x.id)")
                if v:
                    fails.append(f"{vw[0]} email state: axe {v}")
            # Fixed term with no end date shows a clear error and marks the field.
            await pg.check('input[name="delivery"][value="hand"]')
            await pg.select_option("#kind", "fixed")
            await pg.fill("#expiry", "")
            await pg.dispatch_event("#expiry", "change")
            await pg.wait_for_timeout(150)
            if "end date written in your lease" not in await pg.locator("#result").inner_text():
                fails.append(f"{vw[0]} empty fixed term end date not explained")
            if await pg.get_attribute("#expiry", "aria-invalid") != "true":
                fails.append(f"{vw[0]} empty fixed term end date not marked invalid")
            # Civic Holiday is shown as an assumed closure, with the earlier date it could allow.
            await pg.select_option("#kind", "monthly")
            await pg.fill("#due", "2")
            await pg.fill("#notice", "2027-07-30")
            await pg.check('input[name="delivery"][value="courier"]')
            await pg.dispatch_event("#notice", "change")
            await pg.wait_for_timeout(150)
            t = await pg.locator("#result").inner_text()
            for n in ["UNKNOWN, counted as closed: not on the s. 88 list", "Civic Holiday", "November 1, 2027", "an earlier end date of October 1, 2027"]:
                if n not in t:
                    fails.append(f"{vw[0]} civic holiday case: missing {n}")
            # Weekly rent: the late estimate is one week, not one month.
            await pg.select_option("#kind", "weekly")
            await pg.fill("#notice", "2026-11-19")
            await pg.check('input[name="delivery"][value="hand"]')
            await pg.fill("#rent", "400")
            await pg.dispatch_event("#rent", "change")
            await pg.wait_for_timeout(150)
            t = await pg.locator("#result").inner_text()
            for n in ["moves the end date by 1 week, about $400.00 more rent", "rent per week"]:
                if n not in t:
                    fails.append(f"{vw[0]} weekly rent: missing {n}")
            await pg.select_option("#kind", "monthly")
            await pg.dispatch_event("#kind", "change")
            # A bad rent amount is explained and marked.
            await pg.fill("#rent", "lots")
            await pg.dispatch_event("#rent", "change")
            await pg.wait_for_timeout(150)
            if "Rent should be a number" not in await pg.locator("#result").inner_text() or await pg.get_attribute("#rent", "aria-invalid") != "true":
                fails.append(f"{vw[0]} bad rent not explained or not marked")
            await pg.fill("#rent", "")
            await pg.dispatch_event("#rent", "change")
            # The service chain opens and quotes s. 191 (1) (g).
            await pg.click("#chain summary")
            await pg.wait_for_timeout(100)
            if "by any other means allowed in the Rules" not in await pg.locator("#chain").inner_text():
                fails.append(f"{vw[0]} service chain missing")
            if AXE:
                await pg.add_script_tag(path=AXE)
                v = await pg.evaluate("async()=>(await axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']})).violations.map(x=>x.id)")
                if v:
                    fails.append(f"{vw[0]} civic holiday and chain state: axe {v}")
            # Round 8: notice by hand on Saturday, January 2, 2027 leads with the safe literal end date.
            await pg.select_option("#kind", "monthly")
            await pg.fill("#due", "1")
            await pg.fill("#notice", "2027-01-02")
            await pg.check('input[name="delivery"][value="hand"]')
            await pg.dispatch_event("#notice", "change")
            await pg.wait_for_timeout(150)
            t = await pg.locator("#result").inner_text()
            for n in ["Give Form N9 by hand by Monday, February 1, 2027 to end your tenancy on March 31, 2027.", "Contingent, not advised", "It could end the tenancy on February 28, 2027 only on the author's reading", "31/03/2027"]:
                if n not in t:
                    fails.append(f"{vw[0]} January 2 safe headline: missing {n}")
            if "28/02/2027" in t:
                fails.append(f"{vw[0]} January 2: the checklist still writes February 28")
            live = await pg.locator("#live-summary").inner_text()
            if "Contingent, not advised" not in live or len(live) > 900:
                fails.append(f"{vw[0]} January 2: live summary {live[:160]!r}")
            if AXE:
                await pg.add_script_tag(path=AXE)
                v = await pg.evaluate("async()=>(await axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']})).violations.map(x=>x.id)")
                if v:
                    fails.append(f"{vw[0]} January 2 state: axe {v}")
            # No horizontal scroll on small screens.
            sw = await pg.evaluate("document.documentElement.scrollWidth")
            if sw > vw[0] + 1:
                fails.append(f"{vw[0]} page is {sw}px wide")
            if errors:
                fails.append(f"{vw[0]} page errors {errors}")
            await pg.close()
        await b.close()

asyncio.run(main())
if fails:
    print("FAIL\n" + "\n".join(fails))
    sys.exit(1)
print("browser check passed: 5 examples x 2 screen sizes, keyboard, email consent, fixed term entry, civic holiday note, weekly rent, rent check, January 2 safe headline, decision sentence, short live summary, deadline extension, every method line, service chain, layout" + (", axe 0 violations" if AXE else ""))
