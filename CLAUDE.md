# Project Guidelines — Servi-Hogar

> Generated from `.github/copilot-instructions.md`. Keep both in sync when conventions change.

## Overview

Appliance rental management system for a Mexican rental business. Tracks machines (washers/dryers), customers, rents, deliveries, pickups, payments, maintenance, sales, and technician workflows.

## Stack

- **Next.js 12** (Pages Router) · **React 17** · **TypeScript 4.8** (mixed JS/TS, `strict: false`)
- **MUI 5** with Emotion CSS-in-JS, Spanish locale (`esES`)
- **MongoDB** via Mongoose 6 (models in `lib/models/`)
- **next-auth** (Credentials provider, JWT sessions, role-based access)
- **SWR** for client-side data fetching/caching
- **Axios** with global interceptors (`lib/client/axiosConfig.js`)
- **Google Cloud Storage** for file uploads
- **dayjs** (es-mx locale) + date-fns for date operations
- Timezone: `America/Mazatlan` (set via `TZ` env in scripts)

## Build & Run

```bash
npm install          # install dependencies
npm run dev          # dev server on localhost:3000 (TZ=America/Mazatlan)
npm run build        # production build
npm start            # production start
```

Requires `.env` with: `MONGO_URI`, `CLOUD_PROJECT`, `CLOUD_EMAIL`, `CLOUD_KEY`, `CLOUD_BUCKET`, `FILES_HOST`, `NEXTAUTH_SECRET`, `MAPS_API_KEY`.

Optional: `CASH_CUT_START_DATE` (ISO date) — fecha desde la que el corte de caja considera cobros en efectivo. Sin ella se usa el valor por defecto en `lib/consts/OBJ_CONTS.js`. Todo lo cobrado antes de esa fecha queda fuera de los cortes.

## Architecture

```
pages/               # Next.js routes (file-based, Spanish names)
  api/               # API routes — one folder per domain (machines/, rents/, etc.)
  [domain]/          # Feature pages (equipos/, rentas/, clientes/, pagos/, etc.)
lib/
  models/            # Mongoose schemas + TS interfaces (Machine.ts, Rent.ts, etc.)
  data/              # Server-side data access layer — business logic per domain
  client/            # Client-side fetch wrappers, axios config, utils
  consts/            # Enum-like constants (MACHINE_STATUS_LIST, PAYMENT_REASONS, etc.)
  auth.js            # validateServerSideSession(), getUserId(), validateUserPermissions()
  db.js              # connectToDatabase(), isConnected()
  cloud.js           # Google Cloud Storage operations (uploadFile)
src/
  components/        # Feature-organized MUI components (modals, tables, forms)
  layouts/           # SidebarLayout (role-based nav), BaseLayout
  theme/             # MUI theme provider with localStorage persistence
  contexts/          # SidebarContext, UserBlockedContext
  hooks/             # Custom React hooks
types/               # TS declarations (next-auth.d.ts)
```

## Conventions

### Language
- UI labels, route names, and feature folders: **Spanish** (`equipos`, `rentas`, `clientes`)
- Code identifiers (variables, functions, model fields): **English** (`getMachinesData`, `onRent`, `currentWarehouse`)
- Comments and user-facing strings: **Spanish**

### API Routes
- Pattern: `pages/api/[domain]/[action].js` (plain JS)
- For multipart uploads disable bodyParser: `export const config = { api: { bodyParser: false } }`
- Use `formidable` for multipart/form-data parsing (field/file values may be arrays — normalize with a `one()` helper)
- Validate permissions: `validateUserPermissions(req, res, ["ADMIN", "AUX"])`
- Response shape: `{ data, msg, errorMsg }`

### Data Layer (`lib/data/`)
- One file per domain (Machines.js, Rents.js, Customers.js, etc.)
- Always check DB connection: `if (!isConnected()) await connectToDatabase()`
- Multi-write operations run in a Mongoose transaction (`session.startTransaction()` / `commitTransaction()` / `abortTransaction()` + `endSession()` in `finally`/catch)
- Use Mongoose aggregation pipelines + `.populate()` for complex queries

### Client Fetch (`lib/client/`)
- One `*Fetch.js` per domain
- **Use `axios` for HTTP calls, never `fetch`** (global interceptors live in `axiosConfig.js`)
- Return `{ error, msg }` on failure
- Trigger SWR revalidation via `refreshData()` after mutations

### Image / File uploads
> Two rules that MUST be followed for every flow that captures photos or files.

- **Client-side compression is mandatory before upload.** Compress each image with `compressImage()` from `lib/client/utils` before appending it to the `FormData`, exactly as done in existing flows (e.g. `pages/almacen/registrar-compra`, `pages/reparaciones-externas/registrar`). Never send raw camera-sized files.
- **Upload to Google Cloud asynchronously / in parallel.** In the data layer, upload multiple files concurrently with `Promise.all(...)` over `uploadFile(filepath, fileName)` — do **not** `await` uploads one-by-one in a loop. Prefer uploading **before** opening a DB transaction so the transaction is not held open during network I/O. Reference: `createExternalRepairData` in `lib/data/ExternalRepairs.js`, rent-delivery uploads in `lib/data/Deliveries.js`.
- Required photos must be validated on **both** the client (block submit) and the server (throw before upload).
- `uploadFile(filePath, fileName)` in `lib/cloud.js` uploads to GCS, makes the object public, and returns its public URL.

### Components
- Feature-organized modals under `src/components/` (e.g., `AddMachineModal/`)
- Use MUI `styled()` for custom avatar/card wrappers
- Path alias: `@/*` → `./src/*`, `@/public/*` → `./public/*`

### Loading states
- Every page/table/section that fetches data with SWR MUST show a loading indicator while `isLoading` is true — never render an empty table or blank area during fetch. Follow the existing pattern: a centered MUI `CircularProgress` (e.g. `<Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>`) or `Skeleton` inside the card, and a distinct empty-state message only when `!isLoading && data.length === 0`. Reference: `pages/recolectadas/*` tables, `pages/mantenimientos/index.tsx`.

### Auth & Roles
- Roles: `ADMIN`, `AUX` (office), `TEC` (technician), `OPE` (operator/route/driver), `SUB`, `PARTNER`
- Technicians require tools assigned before login
- User states: `isActive`, `isBlocked`, `isSuperUser`
- Server-side: `validateServerSideSession()` in `getServerSideProps`; redirect by role when a page is role-restricted
- Client-side: session from `next-auth/react`

### Models
- Defined in `lib/models/*.ts` with Mongoose + TS interfaces
- Pattern: `export const Machine = mongoose.models.machines || model('machines', MachineSchema)`
- Use ObjectId refs for relations, populate as needed

### Constants
- Status enums in `lib/consts/OBJ_CONTS.js` (e.g., `MACHINE_STATUS_LIST`)
- API URLs in `lib/consts/API_URL_CONST.js`

## Verification

- Typecheck the whole project with `node_modules/.bin/tsc --noEmit` (expects 0 errors).
- `.js` files under `lib/` and `pages/api/` are ESM — parse-check with the project's Babel preset (`next/babel`) rather than `node --check`.
