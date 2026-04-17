# Project Guidelines — Servi-Hogar

## Overview

Appliance rental management system for a Mexican rental business. Tracks machines (washers/dryers), customers, rents, deliveries, pickups, payments, maintenance, sales, and technician workflows.

## Stack

- **Next.js 12** (Pages Router) · **React 17** · **TypeScript 4.8** (mixed JS/TS, `strict: false`)
- **MUI 5** with Emotion CSS-in-JS, Spanish locale (`esES`)
- **MongoDB** via Mongoose 6 (47 models in `lib/models/`)
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
  cloud.js           # Google Cloud Storage operations
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
- Always disable bodyParser: `export const config = { api: { bodyParser: false } }`
- Use `formidable` for multipart/form-data parsing
- Validate permissions: `validateUserPermissions(req, res, ["ADMIN", "AUX"])`
- Response shape: `{ data, msg, errorMsg }`

### Data Layer (`lib/data/`)
- One file per domain (Machines.js, Rents.js, Customers.js, etc.)
- Always check DB connection: `if (!isConnected()) await connectToDatabase()`
- Use Mongoose aggregation pipelines + `.populate()` for complex queries

### Client Fetch (`lib/client/`)
- One `*Fetch.js` per domain wrapping axios/fetch calls
- Return `{ error, msg }` on failure
- Trigger SWR revalidation via `refreshData()` after mutations

### Components
- Feature-organized modals under `src/components/` (e.g., `AddMachineModal/`)
- Use MUI `styled()` for custom avatar/card wrappers
- Path alias: `@/*` → `./src/*`, `@/public/*` → `./public/*`

### Auth & Roles
- Roles: `ADMIN`, `AUX`, `TEC` (technician), and others
- Technicians require tools assigned before login
- User states: `wasRemoved`, `isBlocked`, `isSuperUser`
- Server-side: `validateServerSideSession()` in `getServerSideProps`
- Client-side: session from `next-auth/react`

### Models
- Defined in `lib/models/*.ts` with Mongoose + TS interfaces
- Pattern: `export const Machine = mongoose.models.machines || model('machines', MachineSchema)`
- Use ObjectId refs for relations, populate as needed

### Constants
- Status enums in `lib/consts/OBJ_CONTS.js` (e.g., `MACHINE_STATUS_LIST`)
- API URLs in `lib/consts/API_URL_CONST.js`
