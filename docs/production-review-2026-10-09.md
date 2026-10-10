# Diaper Boyz — production and maintainability review

Date: 2026-10-09. Scope: standalone `hikaribrandan3-code/mileirunner`, its listing, four characters, intro/launch lifecycle, powers, collision/track rules, pressure, save data, rendering/resources, audio, recovery, responsive UI and release checks.

## Outcome

The chainsaw issue was real. The existing yellow saw was mounted on a scaled hand bone and almost edge-on, while an orange arc dominated the effect. It now faces the gameplay camera beside Milei's hand, using the original `chainsaw-held-v2.webp`. It vibrates, plays the existing saw loop and produces cutting sparks. Its lane-clear contract removes every hazard ahead, including vehicles, overhead blockers and road holes, while preserving paper, ramps, roofs and other lanes.

Flight and big heads remain the common signature mechanics for all four characters. Their third abilities now have different rules. Character designs were preserved.

This is a compact static game with substantial readability debt. This pass fixes reproduced defects and adds repeatable checks; it does not claim that all conceivable bugs have been eliminated or that the source has been comprehensively refactored.

## Findings fixed

Priority describes practical impact, not a security classification.

| Priority | Finding | Repair/evidence |
| --- | --- | --- |
| P1 | Required gameplay asset errors were swallowed by `Promise.allSettled`. | Required jobs now reject; failed jobs retry without rerunning completed jobs. Missing-flight-art boot/retry probes pass. |
| P1 | Trump/Ben materials used Blender suffixes such as `diaper cotton.001`, so exact-name binding omitted pressure shaders. | Normalize material semantics. Browser checks confirm all four rigs have pressure receivers following the actual engine meter. Also repairs suffixed clothing/shoe matching. |
| P1 | Several solids were omitted from big-head/burger destruction; saw lacked a complete clear path. | Central hazard sets cover track shapes. Tests exercise every kind, crossing long obstacles, lane changes and preservation of pickups/supporting geometry. |
| P2 | Chainsaw hidden by its transform and replaced visually by a small orange effect. | Camera-facing held asset; flame arc removed. Visibility verified on small phone, iPad portrait/landscape and desktop. |
| P2 | Ben's third power duplicated Bibi speech. | PAPER STORM pulses across three lanes every 0.85 active seconds and opens chase distance on activation. Bibi speech remains current-lane clearing. |
| P2 | Repeated character changes increased texture count. | Reuse cloth/bump maps; dispose owned expression maps and restore base maps. Four complete character cycles remain bounded in both engines. Earlier eight-switch probe: 57→74 textures before, warm plateau 67/68 after. |
| P2 | Failed character/theme preparation could leave the prior rig with another character's pursuers. | Theme identity commits after preparation; restoring a valid previous rig restores its theme. Validate replacement model bounds before disposing the active rig. Recovery probes pass. |
| P2 | Milei's required composite intro stage was not validated before Play. | Validate/retry the stage with the selected intro. Missing-stage/retry probes pass. |
| P2 | Access-denied `localStorage` getter could throw before the catch. | Access is inside guarded reads/writes. Denied getter, malformed saves and bounded values are tested. |
| P2 | Rescue flight supplied its paper route twice; other flights once. | All flights supply sixteen airborne papers exactly once. |
| P2 | Chicken small-head was purely cosmetic. | Useful overhead clearance; traffic still collides. |
| P2 | Ground powers omitted the pre-expiry warning. | One warning at two seconds remaining; expiry/pause restoration covered. |
| P2 | Pooled obstacles retained `roofVisited`. | Reset on spawn. |
| P2 | External music applied its slider twice and retained ended-source references. | Slider applied once through the bus; ended sources disconnect and clear references. Power loops stop/resume with screen state. |

Earlier unlock-queue/intro crash and mobile/iPad/desktop flow repairs remain in place. Their full suites were rerun on this patch.

## Power contracts

Opening sequence: **flight → unique third power → big head**. First flight is offered on a cleared approach; missing it does not force activation. The existing 80% flight selection share after the showcase remains unchanged. Other powers therefore can feel rare later in a run; this is the requested flight-heavy balance, not a missing asset.

| Runner | Flight | Big head | Third power |
| --- | --- | --- | --- |
| Milei | VUELO PRESIDENCIAL: helicopter/rope/swing | Lion: solid nonvehicle hazards on contact | ¡AFUERA!: visible saw, continuous current-lane clearing within 15 m; includes traffic/holes |
| Trump Jr | AIR FORCE JR: military helicopter/rope | HAM MODE: solid nonvehicle hazards on contact | BIG MAC ATTACK: bulldozer, solids/vehicles on contact; holes remain |
| Bibi | THE CHOSEN FLIGHT: floating power | BIBI BIBI: solid nonvehicle hazards on contact | SPEECH MODE: continuous current-lane solid clearing within 15 m; holes remain |
| Ben Jr | CLUCK AIRLINES: chicken drone/rotors | BIG BEN: solid nonvehicle hazards on contact | PAPER STORM: all-lane solid pulses within 15 m every 0.85 s, plus chase relief; holes remain |

All flights avoid ground collisions, provide airborne paper and have protected landings. Additional pickups remain: magnet/dollars, Trump's MAGA shield/boost, Bibi's VICTIM CARD shield and Ben's CHICKEN HEAD. All seventeen IDs were exercised for activation, icon/HUD, rendering and expiry. The internal `presspanic` ID survives the PAPER STORM rename for compatibility.

## Diaper logic

One meter drives HUD, failure and shader/particle presentation. Swelling/staining are derived visuals, not separate failure counters.

```text
base fill per second = meterRate + min(meterExtra, elapsed × meterRamp)
effective fill = base × 0.35 during big-head/burger powers; otherwise base
meter = min(100, meter + effective fill × active dt)
paper = max(0, meter − 2.5)
ordinary stumble = min(100, meter + difficulty hit penalty)
100% = meter failure
```

Pause/menu/intro do not advance run pressure. Hit-stop and stumble slowdown slow the simulation clock. Bonus-power activation keeps its three-point relief; inherited Milei powers retain their existing relief. Chase capture is an independent failure route. Destroying obstacles awards score, not paper relief.

| Difficulty | Starts | Old → new base (%/s) | Ramp | Extra cap | Hit | Old → new no-paper failure* |
| --- | --- | --- | --- | --- | --- | --- |
| Easy | 10% | 1.9 → 2.4 | .012 | 1.9 | +10 | 41.85 → 34.53 s |
| Medium | 15% | 2.25 → 2.8 | .014 | 2.25 | +14 | 34.15 → 28.35 s |
| Hard | 20% | 2.6 → 3.2 | .016 | 2.6 | +18 | 28.32 → 23.62 s |

*Deterministic 60 Hz fixture with no paper, hits, powers, obstacles or chase capture. Actual survival depends on play. Base fill increases about 23–26%; smash suppression changes from .08 to .35 so large heads no longer nearly freeze filling. Opening collision/chase grace remains unchanged.

Swelling/staining start at 15%; leaking starts above 20%. Leak frequency increases with meter bands, using bounded pooled drops/splats. All four rigs now bind the effect.

## Maintainability

Good foundations: deterministic engine/randomness, fixed 60 Hz simulation, swept collisions, bounded pools, instanced repeated geometry, separated chase/track/storage/audio/presentation modules, local-only fixtures, launch cancellation, same-origin iframe messaging and bundled runtime dependencies.

Added: small `power-rules.js`, `pressure.js`, `rig-materials.js` contracts, executable Node tests, browser audit runner, CI syntax/import/asset/simulation gates and an accurate README.

Remaining work, in priority order:

1. **P2: readability/ownership.** Large compressed methods in `main.js`, `renderer.js`, `models.js` and legacy inheritance increase regression risk. Extract named screen, launch and resource owners in small behavior-preserving changes, gated by these tests. Avoid simultaneous engine/UI rewrites.
2. **P2: loading deadlines.** Character fetch and optional audio have timeouts; many texture/image/rope loads depend on the browser's network timeout. Missing-file rejection/retry is verified, but an indefinitely pending request can still leave loading pending. Add one cancellable loading policy with deadlines, retries and late-arrival disposal.
3. **P2: physical-device rendering budget.** Skinned foot-contact scans, frame allocation, sprite/3D mixing and dense road/pursuer geometry need phone/iPad profiling. Adaptive low-quality mode reduces pixel ratio but does not eliminate animation/draw-call costs. Desktop-host measurements cannot establish mobile FPS.
4. **P2: declarative manifest.** Character names, selector descriptions, HUD icons, signatures and audio mappings remain split across files. Generate mappings from one validated definition to prevent drift.
5. **P3: reproducible browser CI.** Node checks run in GitHub Actions; browser audits need Chrome/WebKit provisioning and a static server. Add pinned dev tooling and CI evidence artifacts. Current scripts support an external Playwright module.
6. **P3: localization/progression.** Some result, ability and achievement copy stays English or Spanish regardless of preference. Records aggregate difficulties. Revisit the intentional 80% flight share as a separate balance decision.
7. **P3: asset provenance.** Preserve Blender export sources and repeatable compression/model validation beside canonical GLBs. Avoid deleting legacy art during a behavior-fix release without a usage inventory.

## Data/security boundaries

Listing messages check both origin and iframe source; game messages check origin and parent source. Viewer/character/context strings are inserted as text. Debug/unlock query fixtures are local-host-only. Save values are sanitized; denied persistence is recoverable. This static runtime has no remote account, authoritative leaderboard or payment transaction. Support controls copy the donation alias; client records remain user-editable.

This is a source/runtime boundary review, not penetration testing or third-party dependency certification. Vendored internals and native platform APIs were not exhaustively audited.

## Verification

- 17 passing Node tests; production checks pass for 27 modules, 55 imports and 82 asset references.
- Chromium + WebKit: 85 power checks, 30 failure/recovery checks, 251 mobile-flow checks and 129 responsive checks **per engine**.
- Chromium: 13 native-input checks, including touch swipes and iframe pause/exit.
- Chromium + WebKit: zero uncaught runtime errors or failed requests in separate resource/performance samples across all four characters.

Total: **1,007 browser assertions** including four performance/network assertions, plus 17 Node tests. Flow tests cover fresh locks, engine-earned unlocks, persisted progress, all five real-time intro shots for each character, gameplay handoff, pause/resume, results, share, character changes after losing, exit/reopen and recovery. Power tests include four full model-switch cycles and saw visibility at 320×568, 768×1024, 1024×768 and 1440×900. Responsive tests span nine tablet/desktop sizes.

Release `1fb65d2` was pushed to `main`. The production alias serves exact copies of the reviewed rule, engine, renderer, controller, effects and character modules. `scripts/audit-production.cjs` adds **25 live checks per engine**, passing in Chromium and WebKit: fresh menu without preview, fresh locks, no debug exposure, all four complete intros reaching RUNNING, selected pause portraits and no runtime/missing-asset errors. These private test profiles seed earned unlocks locally; they do not alter other players' progress.

Failure probes intentionally abort downloads, deny storage, stall audio and simulate GPU context loss. Unlock fixtures advance actual simulation ticks; they are not a physical two-minute survival playtest.

Reports/screenshots are generated under `AUDIT_OUTPUT` (default `/private/tmp/diaper-production-review/`), with reproducible scripts committed. Performance probes run sequentially and report their desktop/headless/local-server limits. Physical phone/iPad GPU, thermals, OS share sheets and autoplay policies still need hardware verification.

Measured local samples: boot reached readiness in about 1.5 seconds; visiting all four characters reported 26.6 MiB of encoded resources in Chromium and 29.8 MiB in WebKit (includes repeated/cached entries, not just initial download). Render samples used roughly 170–183 draw calls and 178k–238k triangles. Chromium frame p95 was about 16.8 ms; WebKit about 34 ms and activated reduced quality. First-character samples included individual 200/153 ms stalls. These are short desktop-host diagnostics, not a mobile performance guarantee. Asset budget and shader/first-use stalls remain optimization targets.

Public URL: https://diaperboyz.vercel.app.
