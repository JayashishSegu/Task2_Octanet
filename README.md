# 🔥 Website Roast

**Brutally honest, technically accurate AI website reviews.**
Paste any URL and get roasted — design, UX, SEO, performance, accessibility,
trust, branding, copywriting, and conversion, scored **0–100** with a full
improvement report. Think *"If Simon Cowell reviewed websites."*

Every criticism is backed by an actual observation from your live site.
No fake problems, ever.

## Features

- **Evidence-based analysis** — fetches the live HTML and extracts 40+ real
  signals: metadata, headings, alt-text coverage, form labels, CTAs, trust
  pages, security headers, compression, fonts, colors, readability, and more.
- **Real Lighthouse metrics** — optional Google PageSpeed Insights integration
  for performance / accessibility / SEO / best-practices scores and Core Web
  Vitals (LCP, CLS, TBT).
- **AI-written roast** — via the Vercel AI SDK against any OpenAI-compatible
  endpoint, grounded strictly in the collected evidence.
- **Deterministic fallback** — with no API key, a heuristic engine generates
  the full report from the same evidence. The app works out of the box.
- **11 category scores** — Design, UX, Accessibility, Performance, SEO, Trust,
  Branding, Copywriting, Conversion, Developer Quality, Visual Consistency —
  each with score, explanation, evidence, and suggested fix.
- **The Roast** — witty one-liners, each citing the observation behind it.
- **Improvement report** — why it matters / how to fix / expected impact,
  prioritized Critical → Low.
- **The Wins** — genuine strengths, celebrated specifically.
- **Final verdict** — would you launch it? Would investors trust it? Would
  users stay? Would Google love it?
- **Dashboard UI** — animated score gauge, progress rings, expandable
  category cards, glassmorphism, skeleton loading, smooth Framer Motion
  animations, dark mode, mobile-first responsive design.
- **Extras** — export PDF (print), copy report as Markdown, share link,
  local history, best/worst leaderboard, random roast.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · TailwindCSS · shadcn/ui ·
Framer Motion · Lucide Icons · Vercel AI SDK · Zod · Cheerio

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables (all optional)

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Enables the LLM-written roast (Vercel AI SDK). Without it, the deterministic evidence engine writes the report. |
| `OPENAI_BASE_URL` | Point at any OpenAI-compatible endpoint (Azure, Groq, Together, OpenRouter, local). |
| `OPENAI_MODEL` | Model id, defaults to `gpt-4o-mini`. |
| `PAGESPEED_API_KEY` | Enables real Lighthouse metrics via Google PageSpeed Insights ([get a free key](https://developers.google.com/speed/docs/insights/v5/get-started)). |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for SEO metadata (e.g. your production domain). |

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push this repo to GitHub.
2. Import it in Vercel — the framework preset is detected automatically.
3. Add the environment variables above (all optional).
4. Deploy. `vercel.json` already sets a 60s function budget for analysis.

## Architecture

```
app/
  actions/roast.ts        Server Action: validate → fetch → analyze → roast
  page.tsx                Landing page (hero, examples, features)
  roast/page.tsx          Roast report dashboard (?url=…)
  history/  leaderboard/  Local-storage history & best/worst boards
lib/
  analyzer/fetch-site.ts  Live HTML fetch + 40-signal extraction (Cheerio)
  analyzer/checks.ts      ~35 evidence-based checks with roasts & fixes
  analyzer/heuristics.ts  Deterministic scoring + report builder
  analyzer/pagespeed.ts   Optional Lighthouse via PageSpeed Insights
  ai/generate-report.ts   Vercel AI SDK generateObject, evidence-grounded
components/
  ui/                     shadcn/ui primitives
  roast/                  Gauge, rings, roast cards, improvements, verdict
```

**Honesty guarantee:** scores and roast lines are derived from named checks
against real signals. The LLM is instructed to never invent problems, and the
fallback engine is incapable of it — every line carries its `basedOn` evidence.

Screenshots are rendered via the free [thum.io](https://www.thum.io) service;
favicons fall back to Google's favicon API.

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | TypeScript with no emit |
