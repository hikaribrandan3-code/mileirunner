# Loading, timed effects and character unlock review

## Scope

Compared previous release fb61383 with this patch using fresh Chrome contexts, disabled browser cache, 390 × 844 viewport and a local static server. Local transfer sizes are uncompressed; production CDN compression and network/phone hardware differ. These are controlled measurements, not a claim of iPhone or live-production speed.

| Connection | Before menu | After menu | Before first Play | After first Play |
| --- | ---: | ---: | ---: | ---: |
| Unthrottled local | 1.27 s | 0.26 s | 1.50 s | 1.00 s |
| 5 Mbps, 80 ms latency | 25.26 s | 1.82 s | 27.13 s | 24.37 s |

One sample per configuration; exact times vary. The illustrated menu is now independent of WebGL startup. The full scene still needs about 22.5 seconds on the throttled local connection. Play waits safely for that scene rather than starting with missing assets. The first cinematic artwork loads on demand. Total local transfers through first Play fell from 16.13 MB to 14.42 MB (about 11%). Existing live-release unthrottled test measured 6.63 seconds to menu and 10.78 MiB transferred; its slow test timed out and is not a valid before/after benchmark.

## Implemented

- Show illustrated menu after its cover/fonts; import WebGL afterwards and warm the scene in the background.
- Remove forced minimum boot wait and unrelated intro/result art from the startup gate.
- Lazy-load hidden HTML illustrations. Preserve texture atlas dimensions/UVs while recompressing five oversized WebP assets; see LOAD-ASSET-SAVINGS.json.
- Do not fetch the carousel video until its card is visible; pause it while the game dialog is open.
- Optional sampled audio waits for a resumed audio context.
- Prioritize character-model fetch and extend its watchdog from 15 to 60 seconds. The 15-second abort was reproduced under throttling. Loading failure shows a retry action.
- Add performance marks for menu readiness and scene readiness and commit the reusable fresh-load audit.

## Remaining opportunities

The 3.29 MB character GLB and three roughly 0.9–1.1 MB press GLBs remain the largest uncompressed startup files. A separate asset-pipeline pass could evaluate Meshopt/Draco and embedded texture compression, with decoder/animation/rig verification. Further scene streaming would need safety guarantees that required obstacles/powers/actors are installed before spawning. Versioned long-lived asset caching can improve repeat visits but needs invalidation safeguards; no service worker or immutable caching was added in this patch. More aggressive texture downscaling needs close-up quality checks. These were not silently implemented as risky late changes.

## Timed cosmetic leakage

At 20 seconds of active simulation, visual pressure becomes at least 84 and reaches 100 at 30 seconds, regardless of collected paper. The real meter, relief, score and failure rules are unchanged. Pause freezes elapsed time; restart resets it. All four rigged diaper materials and bounded leak/splat pools were checked at meter zero and elapsed 20; each reported a stained receiver, seep and particles. Rendered screenshots inspected locally. These fixtures establish visual behavior, not naturally earned survival.

## Unlocks

Trump 60 s, Bibi 90 s, Ben 120 s in one active run. Unlock and save immediately at the threshold, retain end-of-run celebration, recover missing historical unlock flags from saved bestSurvival, show seconds explicitly and display survival time on results. Browser fixtures confirmed save/reload and real selector launch of Bibi and Ben. Local test-character mode remains isolated and never writes progress.

## Checks

20 rule/regression tests pass, production syntax/import/asset check passes, all-four-character cosmetic/browser checks pass, save/reload and Bibi/Ben launch pass, early Play during delayed model download reaches cinematic without script errors. Fresh-load cases have no script/request failures after the timeout fix. Native phone performance, battery/thermal behavior and unreliable mobile networks require physical-device coverage.

Run scripts/audit-fresh-load.cjs and scripts/audit-timed-effects.cjs with PLAYWRIGHT_MODULE and AUDIT_BASE pointing to your environment.
