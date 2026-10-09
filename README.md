# Diaper Boyz: World Tour

Standalone political-parody endless runner, hosted at https://diaperboyz.vercel.app. Production repository: `hikaribrandan3-code/mileirunner`; releases come from `main`.

The root is the listing; Play opens `/game/` fullscreen. Fresh game loads reach the main menu. Every deliberate Play opens the selected character's intro. Milei starts unlocked; Trump, Bibi and Ben unlock after 60/90/120 active seconds survived in one completed run. Progress stays on the device.

## Local development

Static site with bundled libraries, models, art and audio. No build step or runtime package installation is required.

```sh
python3 -m http.server 5198
```

Open `http://127.0.0.1:5198/` for the listing or `/game/` for the game. `/game/?test=1&testCharacters=1` enables local debug controls and all characters without saving test progress. Debug modes work only on `localhost` and `127.0.0.1`.

## Code map

- `game/rebuild/main.js`: screen transitions, async launches, input, fixed simulation ticks, HUD and sharing.
- `engine.js`, `track.js`, `chase.js`, `difficulty.js`, `characters.js`, `power-rules.js`, `pressure.js` in that directory: gameplay rules.
- `renderer.js`, `models.js`, `effects.js`, `signature-effects.js`, `press-actors.js`: Three.js presentation.
- `game/engine.js`, `game/audio.js`, `game/storage.js`: shared legacy base behavior, still runtime dependencies.
- `game/models/`, `game/art/`, `game/audio/`: canonical assets shared by selector/game.
- Root HTML/CSS and `app.js`: listing and same-origin game-dialog protocol.

`game/index.html` uses `game/rebuild/` as its base URL. Touch swipes control lanes/jump/slide. Keyboard: arrows or A/D/W/S, Space to jump, P/Escape to pause.

## Verification

Node 22 is used by CI. Dependency-free checks:

```sh
npm run check
npm test
```

These validate production syntax/imports/assets and deterministic simulation/storage behavior. GitHub Actions runs both on pushes and pull requests.

Browser audits need Playwright (installed locally or supplied through `PLAYWRIGHT_MODULE`), installed Chrome and Playwright WebKit. Start the static server first:

```sh
npm run audit
node scripts/run-production-audit.cjs audit-inputs.cjs audit-performance.cjs
```

`AUDIT_BASE` overrides the server; `AUDIT_OUTPUT` overrides reports/screenshots. Native browser processes must be allowed by the execution environment. Performance runs are sequential to avoid competing browser measurements.

See [production review](docs/production-review-2026-10-09.md) for fixes, power contracts, diaper logic and remaining code cleanup. [Mobile audit](docs/mobile-audit-2026-10-09.md) covers the earlier unlock/intro and responsive repairs. Browser tests do not replace physical phone/iPad testing.

Open Graph/Twitter metadata use the production share image. Listing reviews and campaign art are parody/promotional material. The game includes its satire/non-affiliation notice.
