# NY Economic Incentive Tax Credits Dashboard

A single-page, responsive data storytelling experience built with Next.js (App Router) and Recharts. The dashboard explores how New York State economic incentive tax credits are claimed, allowed, and utilized over time using the public dataset from data.ny.gov.

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui primitives
- Recharts for visualizations
- Edge-ready API Route handlers with 10-minute ISR cache

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to interact with the dashboard. Filters are stored in the URL so they can be shared.

### Environment Variables

The Socrata API performs better with an application token. Add the optional token to a `.env.local` file:

```
SOCRATA_APP_TOKEN=your-app-token
```

Without the token the app still works but displays a badge indicating unauthenticated requests.

## Data API

The dashboard queries a single proxy endpoint at `/api/credits`. The route handler:

- Validates and sanitizes filter query parameters
- Builds SoQL queries against `https://data.ny.gov/resource/4skq-w2i6.json`
- Applies `s-maxage=600, stale-while-revalidate=86400` caching
- Returns raw rows, aggregate totals, facet summaries, and trend data used by the UI
- Streams CSV responses when `format=csv`

A lightweight `/api/health` route is provided for Vercel health checks.

## Deployment

1. Create a new Vercel project and import this repository.
2. In **Settings → Environment Variables**, add `SOCRATA_APP_TOKEN` if you have one.
3. Trigger a deployment. The default `npm run build` / `npm start` workflow is used.
4. After deployment, verify that `/api/health` returns `{ "status": "ok" }` and that `/api/credits` responds with data.

## Project Structure

```
app/
  api/credits/route.ts  # Edge API proxy with caching and CSV export
  api/health/route.ts   # Health check endpoint
  layout.tsx            # Root layout and metadata
  page.tsx              # Main dashboard page
components/             # UI building blocks and data visualizations
lib/                    # Shared utilities (formatting, SoQL builders, URL state)
```

## Testing & Linting

No automated tests are bundled, but TypeScript and ESLint (via `next lint`) keep the project typed and consistent.

## Accessibility & UX Notes

- Semantic HTML sections and aria labels for filters, charts, and tables
- Keyboard-interactive table sorting and filter controls
- Sticky filter bar with share/reset actions and responsive layout down to 360px

Enjoy exploring New York's economic incentive tax credit utilization trends!
