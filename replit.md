# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `lib/object-storage-web` (`@workspace/object-storage-web`)

Uppy v5-based browser upload library for presigned URL uploads to GCS. Exports:
- `ObjectUploader` — Uppy modal file picker component
- `useUpload()` — React hook for programmatic file uploads (2-step presigned URL flow)

### Email (`artifacts/api-server/src/lib/email.ts`)

Transactional emails are sent via **Resend** (`RESEND_API_KEY` secret).
- Sends order confirmation emails on checkout and status update emails from admin.
- **FROM address is currently `onboarding@resend.dev`** (Resend test sender — works without domain verification but can only send to the account owner's email).
- TODO: Once a domain is verified on resend.com, update `FROM` in `email.ts` to e.g. `Senorita Store <orders@yourdomain.com>`.

### `artifacts/senorita` (`@workspace/senorita`)

React 19 + Vite 7 frontend for the Senorita women's fashion store.

- **Admin CMS** at `/admin/*`: Dashboard, Products, Orders, Customers, Categories, Banners, Coupons
- **Image upload** via `ImageUploadField` and `ImageGallery` components in `src/components/admin/`
- **Object storage** routes at `/api/storage/uploads/request-url` (presigned URL) and `/api/storage/objects/*` (serving)
- **Fonts**: Great Vibes (logo only), Playfair Display (headings), Poppins (body)
- **Admin credentials**: `admin@senorita.com` / `admin123`

### Replit Deployment

The project runs as two workflows:
- **API Server** — `PORT=8080 pnpm --filter @workspace/api-server run dev` (console, port 8080)
- **Start application** — `pnpm --filter @workspace/senorita run dev` (webview, port 5000)

The Vite dev server proxies `/api/*` requests to `localhost:8080`.

CORS is configured to allow requests from Replit domains (`.replit.dev`, `.repl.co`) and `FRONTEND_URL` env var.

**Required secrets (set in Replit Secrets):**
- `DATABASE_URL` or `SUPABASE_DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret for signing JWTs
- `RESEND_API_KEY` — For transactional email
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — For image uploads
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — For Razorpay payments
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — For Stripe payments (optional)
- `FRONTEND_URL` — Your Replit app URL (for CORS and email links)

**Also previously on Vercel:** `vercel.json` and `api/index.ts` remain for reference but are not used in Replit.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
