# jarvis-ver2

JARVIS multi-agent HUD dashboard, built step by step (S0–S10). React + TypeScript (strict) + Vite.

## Status

- S0 — project foundation (Vite + React + TS, ESLint, `@/*` alias, feature folders)
- S1 — HUD design tokens, chamfered panels, 3-column static layout
- S2 — central `JarvisCore` canvas visualization (state-colored particle sphere, dynamic pulse while speaking)

Later stages (agent card states, connectors/metrics wiring, real-time store, Whisper voice input, orchestrator
integration, TTS, packaging) are not implemented yet.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint      # eslint .
npx tsc -b        # type check
npm run build     # type check + production build
npm run preview   # preview the production build
```

## Structure

```
src/
  components/    reusable UI primitives (PanelFrame, ...)
  features/
    dashboard/   shell, top bar, core visualization, footer
    agents/      agent roster + card placeholders
    voice/       reserved for the voice input feature
  hooks/         reserved for shared hooks
  lib/           framework-agnostic helpers (prng, particle layout, color)
  styles/        design tokens, global reset, chamfered-panel CSS
  types/         shared TypeScript types
```
