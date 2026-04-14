---
applyTo: "pages/api/**"
description: "Use when creating or editing API routes under pages/api/. Covers route structure, auth validation, response shape, and file upload handling."
---

# API Route Conventions

## Structure

- Pattern: `pages/api/[domain]/[action].js` (plain JS)

## Auth & Permissions

- Validate permissions at the top of every handler:
  ```js
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  if (!validRole) return;
  ```
- Extract user ID when needed: `const userId = await getUserId(req);`
- Imports from `../../lib/auth`

## Response Shape

Always return consistent JSON:
```js
res.status(200).json({ data, msg: "Operación exitosa" });
res.status(400).json({ errorMsg: "Descripción del error" });
```

## File Uploads

Only when the route receives files:
- Disable bodyParser: `export const config = { api: { bodyParser: false } }`
- Use `formidable` for multipart/form-data parsing
- Parse the request body with `formidable.IncomingForm()`
- Attach files to Google Cloud Storage via `lib/cloud.js`

Routes that don't handle files should parse `req.body` manually with a JSON helper or `formidable` fields only.

## DB Access

- Always check connection: `if (!isConnected()) await connectToDatabase()`
- Delegate business logic to `lib/data/[Domain].js` — keep handlers thin

## Method Routing

Use a switch on `req.method`:
```js
export default async function handler(req, res) {
  switch (req.method) {
    case "GET":    // ...
    case "POST":   // ...
    case "PUT":    // ...
    case "DELETE":  // ...
    default:
      res.status(405).json({ errorMsg: "Método no permitido" });
  }
}
```
