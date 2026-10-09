# Diaper Run mobile handoff — 9 October 2026

## This pass

- Added an original, looping clown-circus calliope waltz. Runtime version is a 90 KB mono MP3; its WAV master is retained under `output/diaper-run-finish/audio-masters/v4/`.
- Finished the music/SFX balance with a lower music bed and restrained event cues from the supplied SFX kit. Runtime audio uses compressed MP3s; the supplied WAV kit and source masters remain outside the public runtime folder. The game has procedural audio fallback if sample decoding is late or unavailable.
- Compressed the 3 MB lion-mane PNG to a 256 KB WebP and defer it until lion mode. Gameplay characters, press assets, helicopter and impact textures now load after Play, in parallel with the intro. Share/result art loads only when needed.
- The mobile audio directory is about 964 KB in total. Manifest-referenced audio is about 283 KB; the calliope itself is 90 KB. The public lion-mane WebP is about 256 KB.

## Checks and evidence

- Four Diaper Run suites: 73 tests passed.
- `npm run build`: passed.
- The last 60-second mobile-profile run used headless Chrome with 3× CPU slowdown. iPhone 13 emulation kept standard quality at 57.7 FPS and 16.8 ms frame-interval p95; menu was available in 1.52 s. Pixel 7 emulation fell back to low quality at 29.5 FPS and 66.7 ms p95; menu was available in 0.67 s. Both runs completed five/four rounds without page errors, failed asset responses or audio decode errors; all 35 manifest samples installed.
- A separate 60-second Pixel 7 Chrome-profile run at normal CPU load held 60.0 FPS and 16.8 ms p95, standard quality, with five rounds/38 avoidance inputs and no page errors, failed asset responses or audio errors. Menu was available in 0.43 s.
- These are Chrome device-profile simulations on a desktop, not Safari on iPhone or Chrome on a physical Android. The Pixel result under 3× CPU is still a useful stress warning, while normal-load emulation passed; neither result certifies phone GPU, thermal or Safari behavior.
- The previous broader audit's 90-second desktop run was 58.8–60 FPS at standard quality, but logged nine long tasks, including startup work up to 528 ms. It is not a substitute for the new phone-profile stress test.

## Mobile-site handoff

The game is a static web build and keeps audio behind the user's Play gesture for mobile autoplay compatibility. It is ready for a **mobile-site port smoke test**, not certified for release. Before shipment, run five-minute sessions on a real mid-range Android and an iPhone, including the busy press/helicopter scene, repeated runs, background/resume and sound on the phone speaker. Check the production host's cold-cache loading and the target site's iframe/PWA setup. In particular, verify sustained frame pacing and thermals on Android; the 3× CPU profile triggered the low-quality fallback.

Current local preview: `http://localhost:5192/games/diaper-run/index.html?finish=clown-calliope-v5`

Raw normal-load Pixel evidence: `output/diaper-run-finish/mobile-emulation-pixel-normal-v5.json`; 3× stress evidence: `output/diaper-run-finish/mobile-emulation-v5.json`.
