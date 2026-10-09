# Diaper Boyz: World Tour — mobile, iPad and desktop audit

Date: 2026-10-09. Repository: `hikaribrandan3-code/mileirunner`, `main`.

## Primary failure and repair

The unlock popup searched for a character with `CHARACTERS.find(c => c.id === ids.shift())`. Each comparison removed another queued ID. Unlocking Trump, Bibi or Ben could produce an undefined character and throw while reading its portrait. The save had already recorded the unlock, but the animation loop stopped because its next frame was scheduled after the exception. This reproduced the reported symptom: an unlocked runner was selectable, but subsequent intros/gameplay froze.

The queue now removes exactly one ID before searching. Both separate unlocks and all three unlocks in one run have regression coverage. Later character intros and gameplay continue without refreshing.

## Other repairs

- Play requests sound permission immediately but never waits for optional audio downloads or a pending browser AudioContext resume. Slow or blocked sound cannot freeze the intro.
- Each deliberate Play opens the selected character's complete intro. Its first shot is initialized immediately, and its handoff resets stale input, shake and timing state.
- Back, menu and exit cancel a pending launch. Completing a slow character download after leaving the selector no longer starts a surprise run.
- Character replacements download and validate before disposing the current working rig. Failed model or intro downloads preserve a usable selection and can be retried.
- A failed critical boot presents a visible retry button.
- Every active power's sound loop resumes after pausing. Late optional audio does not restart a previous screen's soundtrack.
- Character switches dispose skeleton textures and deduplicate shared geometry/material disposal.
- Unlock popups use the selector's canonical portraits and fit short phone screens.
- Share cards use the current Diaper Boyz branding; link metadata points to the actual public production alias.
- Legal close has a 44-pixel touch target.

## Larger screens

The game iframe and canvas previously had fixed phone-width limits of 480 and 520 pixels. On larger displays the game now fills the available viewport. iPad portrait retains the portrait composition with larger controls. Landscape iPad and desktop use separate artwork/control columns for the menu, selector and results, with contained intro artwork. The gameplay HUD stays within a readable width over the wider road.

Keyboard controls: arrow keys or A/D to change lanes, Up/W/Space to jump, Down/S to slide, P/Escape to pause. Touch swipes remain supported. Rotating the tablet during flight preserves the active run.

## Automated verification

The committed scripts exercise real Chrome and Playwright WebKit browser engines:

Final local result: **819 passing checks**, zero uncaught runtime errors in the passing suites. The full mobile suites also reported zero missing runtime assets. Chrome and WebKit each passed 251 flow checks, 23 recovery checks and 129 responsive checks; Chrome additionally passed 13 native-input checks.

| Suite | Coverage |
| --- | --- |
| `scripts/audit-mobile.cjs` | 251 checks per engine: fresh locks, settings and menus, genuine engine unlock thresholds, persisted progress, all four five-shot intros, all signature powers, flight, pause/resume, results, sharing, character changes, exit/reopen and missing assets/runtime errors |
| `scripts/audit-mobile-failures.cjs` | Slow/blocked audio, model failure and retry, missing intro and retry, cancelled launch, repeated Play, small-phone unlock controls, multi-unlock queue, GPU context recovery, boot retry and blocked storage |
| `scripts/audit-responsive.cjs` | 129 checks per engine across nine tablet/desktop dimensions, screen controls, keyboard actions and the full-width website game dialog |
| `scripts/audit-inputs.cjs` | 13 Chrome checks: selector arrows, native touch swipes, rotation during flight, records Play, native-share cancellation, iframe Escape pause and close during gameplay |

Phone viewports: 320×568, 360×640, 375×667, 390×844, 430×932 and 844×390. Tablet/desktop: 768×1024, 1024×768, 820×1180, 1180×820, 1024×1366, 1366×1024, 1280×720, 1440×900 and 1920×1080.

Unlock tests advance actual engine ticks in an obstacle-free fixture to exercise 60/90/120-second thresholds; they do not substitute a physical two-minute survival playtest. Intro tests wait for all five real-time shots and the gameplay handoff. Error probes intentionally abort or delay network requests. Native touch swipes use Chrome's touch input dispatcher. WebKit exercises the same pointer handlers with browser input automation.

Run against a local static server, using `PLAYWRIGHT_MODULE` if Playwright is installed outside the repository and `AUDIT_BROWSER=webkit` for WebKit. Debug fixtures are available only on localhost with `?test=1`; production does not expose them.

Reports and screenshots are generated beneath `/private/tmp/diaper-mobile-audit/` and `/private/tmp/diaper-responsive-audit/`. Input evidence is written to `/private/tmp/diaper-input-audit.json`.

## Verification limits

These are browser-engine and viewport tests, not physical iPhone/iPad hardware tests. Native OS share sheets, device-specific audio permissions, actual mobile GPU performance, safe-area behavior on every device and real-world long-session thermal performance still need a handset/tablet pass. The audit does not claim that every possible bug has been eliminated. Gameplay balance and character designs were preserved.

Public production URL: https://diaperboyz.vercel.app
