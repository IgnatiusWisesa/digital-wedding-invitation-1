# Lights of Hope — Wedding Invitation App

A wedding invitation web app ("Lights of Hope") with a romantic lantern festival theme. Guests can RSVP, share wishes, upload photos, and check in via QR code. Includes an admin dashboard for managing guests and check-ins.

## Run & Operate

- `pnpm --filter @workspace/wedding run dev` — run the frontend (Vite + React)
- `pnpm --filter @workspace/api-server run dev` — run the API server (Express)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `MONGODB_URI` — MongoDB connection string (original app uses MongoDB, not PostgreSQL)
- Optional env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — for photo uploads
- Optional env: `ADMIN_USERNAME`, `ADMIN_PASSWORD` — admin login (defaults: admin/admin123)
- Optional env: `JWT_SECRET`, `TICKET_SIGNING_SECRET` — JWT secrets for admin auth and guest tickets

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (Tailwind v4, react-router-dom v7)
- API: Express 5
- DB: MongoDB via Mongoose (original app used MongoDB/NestJS — migrated to Express+Mongoose)
- Validation: Zod (`zod/v4`), via OpenAPI codegen
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `artifacts/wedding/` — React + Vite wedding invitation frontend
- `artifacts/api-server/` — Express backend (RSVP, admin, photos, check-in)
- `artifacts/wedding/src/config/wedding.ts` — wedding details (all from VITE_* env vars)
- `artifacts/wedding/src/config/api.ts` — API URL helper (returns empty string to use shared proxy)
- `artifacts/wedding/public/` — static assets (logo, couple photos, gallery, music)
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `artifacts/api-server/src/routes/rsvp.ts` — RSVP + wishes routes + Mongoose model
- `artifacts/api-server/src/routes/admin.ts` — Admin auth + guest management routes
- `artifacts/api-server/src/routes/photos.ts` — Photo upload/list routes + Mongoose model
- `artifacts/api-server/src/routes/checkin.ts` — QR code check-in route

## Architecture decisions

- Original app used NestJS + MongoDB. Migrated to Express + Mongoose to fit Replit pnpm_workspace stack.
- MongoDB not Postgres — the RSVP/checkin features use MongoDB document patterns (unique by normalizedName, embedded check-in fields). DATABASE_URL is not needed; MONGODB_URI is.
- Photo uploads support Cloudinary (if env vars set) or fall back to storing base64 in MongoDB directly.
- Frontend calls `/api/*` relative URLs — routed to the api-server via the Replit shared proxy.
- Admin auth uses JWT (7d expiry). Guest tickets use HMAC-signed JWTs (90d expiry, HS256).
- Guest quota system: URL path (/two, /three, etc.) maps to max guest count for RSVP.

## Product

- Splash screen with logo, couple names, and "Open Invitation" button
- Main page: animated lanterns + stars, hero section, couple profiles, events/timeline, gallery, gift section, RSVP form
- RSVP: guests submit attendance, get a QR ticket if attending
- Wishes: public wall of guest messages
- Camera / Live Album: guest photo upload and display
- Admin dashboard: guest list, stats, QR check-in scanner, Excel export

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- MONGODB_URI must be set for RSVP/admin/photos to work. Without it, API returns empty data gracefully.
- The tailwind config file was removed — Tailwind v4 uses CSS-based config (`@theme` in index.css).
- Do not add a tailwind.config.js — it conflicts with Tailwind v4.
- The `@import url(...)` must appear BEFORE `@import "tailwindcss"` in CSS files.
- Custom colors (cream, lantern-glow, garden-night, etc.) are defined in `@theme` in `src/index.css`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
