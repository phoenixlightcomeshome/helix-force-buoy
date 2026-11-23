# Helix-Force Buoy — Vite host app

Local-only runnable host for the Helix-Force Buoy build. **Nothing is
published, no repo exists, no link is shared.**

## Provenance

- **Marlow** (GitHub Copilot Free, local CLI) wrote the buoy code in
  `src/` and `scripts/` **from Gemini's design answers and specs** — her
  buoy answers + nine answers, saved home under
  `~/workspace/helix-program/generator-system-design/`. Gemini handed off
  design, sizing, and specs in words and numbers; **she did NOT hand off
  code files**.
- The original build lives at
  `../marlow-buoy-build-20261122/` and is **untouched** — this app is a
  byte-identical copy of its 11 files plus host scaffolding only.
- Full design record, conflicts, and pending-input slots: see `README.md`
  (the copied build README).

## What the app is

Ray's wave-energy buoy: a moored, non-bobbing hull with a weighted
plunger, spiral water path, Halbach heart, and supercapacitor bank. The
app opens in **comparison mode** — both sizing envelopes (A: 180 mm
Marlow; B: 450 mm Gemini) side by side — and the simulator **refuses to
run until an envelope is picked**. No winner is picked anywhere.

**TARGET: 2,000 W — NOT MEASURED.** Every output is labelled
SIMULATION — NOT MEASURED DATA.

## Host scaffolding (the only new files)

`vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`,
`main.tsx`, `index.css`, `package.json` (this manifest), `APP-README.md`
(this file). No logic, envelope, simulation, wording, or dimension was
changed. The air tank stays fixed (`tankOffsetY` = 0) until Gemini's 3D
model spec lands — see README §5 slot 2.

Note: `main.tsx` lives at the project root, not under `src/`, on purpose.
`scripts/check-syntax.ts` scans `src/` and only allows the bare imports
`react`, `react/jsx-dev-runtime`, and `three` there; the React entry needs
`react-dom/client`, so it sits where the check does not scan it, keeping
`bun run build:check` at the original 7 files. No StrictMode wrapper: the
3D scene is built imperatively in an effect.

## Run it

```sh
bun install        # bun only; npm is not reliable for these apps
bun run verify     # 27 checks — lift, power chains, full-cycle sims
bun run build:check  # 7 source files parse; imports resolve
bun run build      # tsc --noEmit + Vite production build
bun run dev        # Vite dev server
bun run preview    # serve the production build
```
