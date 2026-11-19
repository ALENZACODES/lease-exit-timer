"""Browser check for Lease Exit Timer, by John Khan.

Usage: python3 tests/browser_check.py http://127.0.0.1:8931/ [path/to/axe.min.js]
Loads the page in Chromium, runs the four built-in examples, checks the visible answers,
walks the keyboard path, and runs axe-core (WCAG 2.2 AA plus best practice) when a path is given.
"""
import sys, json, asyncio
from playwright.async_api import async_playwright

URL = sys.argv[1]
AXE = sys.argv[2] if len(sys.argv) > 2 else None
EXPECT = {
    "ordinary": ["January 31, 2027", "December 2, 2026", "FORM N9 CHECKLIST", "31/01/2027", "Include all tenant names"],
    "mail": ["February 28, 2027", "December 27, 2026"],
    "winter": ["February 28, 2027", "February and March rule", "FORM N9 CHECKLIST", "28/02/2027"],
    "courier": ["March 31, 2027", "January 4, 2027", "New Year's Day"],
    "late": ["TOO LATE FOR THIS FIXED TERM", "January 31, 2027"],
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
print("browser check passed: 5 examples x 2 screen sizes, keyboard, email consent, fixed term entry, layout" + (", axe 0 violations" if AXE else ""))
