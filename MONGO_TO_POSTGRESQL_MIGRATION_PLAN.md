# Current MongoDB Usage

The project currently uses MongoDB through Mongoose in both the local backend and the Vercel serverless API copy. There are no repository or service layers; controllers and route modules call Mongoose models directly.

## Connection Setup

- `backend/server.js`
  - Imports `mongoose`.
  - Reads `process.env.MONGO_URI`.
  - Exports `ensureDbConnection()` and `getLastConnectionError()`.
  - Caches a MongoDB connection promise in `cachedDbPromise`.
  - Calls `mongoose.connect(uri, { maxPoolSize: 1, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000, bufferCommands: false })`.
  - Registers Mongo connection error/disconnect handlers.
  - Allows missing `MONGO_URI` in local non-production development, but treats it as fatal in production/Vercel.
- `api/app.js`
  - Serverless Express app with its own Mongoose connection logic.
  - Reads `process.env.MONGO_URI`.
  - Exports `ensureDbConnection()`, `getLastConnectionError()`, and `initRoutes()`.
  - Uses the same connection options as `backend/server.js`.
- `api/index.js`
  - Vercel handler.
  - Lazily imports `api/app.js`, calls `initRoutes()`, calls `ensureDbConnection()` on each request, and returns DB initialization errors as JSON.
  - Still contains an unused `dbInitialized` variable.
- `api/_shared/db.js`
  - Imports `mongoose`.
  - Exports `ensureConnection()` and default `mongoose`.
  - Reads `process.env.MONGO_URI` and connects with `serverSelectionTimeoutMS: 10000`.
  - This helper is not the main API request path, but it is Mongo-specific and should be removed or replaced during migration.

## Models / Schemas

The same domain models exist in both `backend/models` and `api/models`:

- `backend/models/productModel.js`
- `api/models/productModel.js`
- `backend/models/Ordermodel.js`
- `api/models/Ordermodel.js`
- `backend/models/SupplierModel.js`
- `api/models/SupplierModel.js`
- `backend/models/Fabric.js`
- `api/models/Fabric.js`
- `backend/models/Eshra.js`
- `api/models/Eshra.js`
- `backend/models/Painting.js`
- `api/models/Painting.js`
- `backend/models/Marble.js`
- `api/models/Marble.js`
- `backend/models/Glass.js`
- `api/models/Glass.js`

Each model imports `mongoose`, defines a `Schema`, and exports `mongoose.models.Name || mongoose.model(...)`.

## Controllers And Query Logic

- `backend/controllers/productController.js` and `api/controllers/productController.js`
  - Use `mongoose.isValidObjectId`.
  - Use `Product.exists`, `Supplier.exists`, `Model.countDocuments`, `Product.create`, `Product.find`, `Product.findOne`, `Product.findOneAndUpdate`, `Product.findOneAndDelete`.
  - Use `.populate()` for product lookup arrays and supplier.
  - Validate product lookup option IDs by counting documents in lookup collections.
- `backend/controllers/OrderController.js` and `api/controllers/OrderController.js`
  - Use `Product.findOne(...).select(...)`.
  - Use `Order.create`, `Order.find`, `Order.findOne`, `Order.findById`, `Order.findOneAndDelete`.
  - Use `.populate()` for nested order item relations.
  - Use document mutation plus `order.save()` so the Mongoose `pre("save")` hook appends status history.
  - Use `Order.find({ status })` for status filtering.
- `backend/controllers/SupplierController.js` and `api/controllers/SupplierController.js`
  - Use `Supplier.create`, `Supplier.find`, `Supplier.findByIdAndUpdate`, `Supplier.findByIdAndDelete`.

## Route Modules With Direct Model Usage

Lookup routes call Mongoose models directly instead of using controllers:

- `backend/routes/FabricRoute.js` and `api/routes/FabricRoute.js`
- `backend/routes/EshraRoute.js` and `api/routes/EshraRoute.js`
- `backend/routes/PaintingRoute.js` and `api/routes/PaintingRoute.js`
- `backend/routes/MarbleRoute.js` and `api/routes/MarbleRoute.js`
- `backend/routes/GlassRoute.js` and `api/routes/GlassRoute.js`

Each lookup route supports create/list/delete using `new Model(req.body).save()`, `Model.find()`, and `Model.findByIdAndDelete(req.params.id)`.

The remaining route modules are Mongo-related because they import controllers that use Mongoose:

- `backend/routes/ProductRoute.js` and `api/routes/ProductRoute.js`
- `backend/routes/OrderRoute.js` and `api/routes/OrderRoute.js`
- `backend/routes/SupplierRoute.js` and `api/routes/SupplierRoute.js`

## DTO / API Shape Assumptions

The frontend does not import MongoDB or Mongoose, but it depends heavily on Mongo-style `_id` response fields and ObjectId-like string IDs:

- `frontend/src/pages/LookupManager.jsx`
  - Uses `item._id` as list key and delete ID.
- `frontend/src/pages/ProductList.jsx`
  - Uses `p._id` as card key.
- `frontend/src/pages/SupplierList.jsx`
  - Uses `s._id` as card key.
- `frontend/src/pages/OrderList.jsx`
  - Uses `order._id` as card key.
- `frontend/src/pages/OrderDashboard.jsx`
  - Uses `o._id` as row/card keys.
- `frontend/src/components/AddOrderModal.jsx`
  - Uses supplier `_id` values in selects and payloads.
  - Expects populated `product.supplier._id`.
  - Uses customization option `_id` values for fabrics, eshra, paintings, marble, and glass.
- `frontend/src/components/AddProductModal.jsx`
  - Uses supplier and lookup `_id` values in selects.
  - Sends `supplier: form.supplierId` to the backend.
- `frontend/src/components/ProductModal.jsx`
  - Maps populated product lookup arrays to `o._id`.
  - Uses `product.supplier?._id`.
- `frontend/src/components/SupplierModal.jsx`
  - Updates/deletes suppliers through `/api/suppliers/${supplier._id}`.
- `frontend/src/components/ProductDetailModal.jsx`
  - Uses `opt._id || opt` when displaying customization chips.

The PostgreSQL migration should either preserve `_id` aliases in API responses during a compatibility phase or update all frontend callers to use new `id` fields.

## Environment Variables And Docs

- `DEPLOYMENT.md`
  - Documents `MONGO_URI` as required for Vercel.
- `deploy-vercel.md`
  - Documents `MONGO_URI`, MongoDB connection-string setup, and MongoDB cluster network access.
- `api/health.js`
  - Returns `hasMongoUri: !!process.env.MONGO_URI`.
- `api/debug.js`
  - Returns Mongo URI presence, length, prefix, and DB connection test results.
  - Imports `../backend/server.js` and calls `ensureDbConnection()`.
- `api/dbstatus.js`
  - Reads `process.env.MONGO_URI`.
  - Imports `../backend/server.js` and calls `ensureDbConnection()` with a timeout.
- `api/mongo-debug.js`
  - Parses `process.env.MONGO_URI`.
  - Imports `mongoose`.
  - Attempts a direct Mongoose connection and closes it.
- `api/check-mongo-env.js`
  - Returns whether `MONGO_URI` is present.
- `api/test-imports.js`
  - Diagnostic endpoint that imports `backend/server.js`, product controller, order controller, and routes. These imports currently load Mongo/Mongoose code.

## Package Dependencies

- `package.json`
  - Depends on `mongoose`.
- `backend/package.json`
  - Depends on `mongoose`.
- `api/package.json`
  - Depends on `mongoose`.
- `package-lock.json`, `backend/package-lock.json`, and `api/package-lock.json`
  - Lock the installed Mongoose dependency tree.

No seed files were found. No automated test suite was found. `api/test-imports.js` is a diagnostic endpoint, not a test runner.

# Current Data Models

## Product

Files: `backend/models/productModel.js`, `api/models/productModel.js`

- `_id`: implicit Mongo ObjectId.
- `productId`: `Number`, required, unique.
- `name`: `String`, required.
- `description`: `String`, optional.
- `fabrics`: array of ObjectId refs to `Fabric`, marked required.
- `eshra`: array of ObjectId refs to `Eshra`, marked required.
- `paintings`: array of ObjectId refs to `Painting`, marked required.
- `marble`: array of ObjectId refs to `Marble`, marked required.
- `glass`: array of ObjectId refs to `Glass`, marked required.
- `supplier`: ObjectId ref to `Supplier`, required.
- `images`: `String`, optional.
- `createdAt`, `updatedAt`: timestamps.

## Order

Files: `backend/models/Ordermodel.js`, `api/models/Ordermodel.js`

- `_id`: implicit Mongo ObjectId.
- `orderId`: `Number`, required, unique.
- `items`: embedded order item array.
- `status`: `String`, enum `New`, `manufacturing`, `Done`, `finished`, default `New`.
- `statusSla`: optional nested object with keys `New`, `manufacturing`, and `Done`; each key can contain `greenDays`, `orangeDays`, and `redDays` numbers.
- `statusHistory`: embedded array of `{ status, date }`.
- `createdAt`, `updatedAt`: timestamps.

Order item fields:

- `product`: ObjectId ref to `Product`, required.
- `fabrics`: array of ObjectId refs to `Fabric`.
- `eshra`: array of ObjectId refs to `Eshra`.
- `paintings`: array of ObjectId refs to `Painting`.
- `marble`: array of ObjectId refs to `Marble`.
- `glass`: array of ObjectId refs to `Glass`.
- `supplier`: ObjectId ref to `Supplier`, required.
- `description`: `String`, optional.
- `quantity`: `Number`, default `1`.

Status history fields:

- `status`: `String`, required.
- `date`: `Date`, default `Date.now`.

## Supplier

Files: `backend/models/SupplierModel.js`, `api/models/SupplierModel.js`

- `_id`: implicit Mongo ObjectId.
- `name`: `String`, required.
- `number`: `String`, required, must match exactly 11 digits through `/^\d{11}$/`.
- `createdAt`, `updatedAt`: timestamps.

## Lookup Models

Files:

- `backend/models/Fabric.js`, `api/models/Fabric.js`
- `backend/models/Eshra.js`, `api/models/Eshra.js`
- `backend/models/Painting.js`, `api/models/Painting.js`
- `backend/models/Marble.js`, `api/models/Marble.js`
- `backend/models/Glass.js`, `api/models/Glass.js`

Each lookup model has:

- `_id`: implicit Mongo ObjectId.
- `name`: `String`, required, unique.
- `createdAt`, `updatedAt`: timestamps.

# Target PostgreSQL Structure

Use relational tables with integer or UUID primary keys. For a low-friction migration from Mongo ObjectIds, use UUID primary keys for new records and add temporary `mongo_id text unique` columns during migration to map existing ObjectId strings. After the frontend and migration scripts no longer need Mongo IDs, `mongo_id` can remain as historical metadata or be removed in a later cleanup.

## Enum

Create a PostgreSQL enum:

```sql
CREATE TYPE order_status AS ENUM ('New', 'manufacturing', 'Done', 'finished');
```

## Core Tables

### suppliers

- `id uuid primary key default gen_random_uuid()`
- `mongo_id text unique null`
- `name text not null`
- `number text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Constraint: `number ~ '^[0-9]{11}$'`
- Indexes:
  - unique index on `mongo_id` where not null
  - optional index on lower `name` if supplier search becomes server-side

### fabrics

- `id uuid primary key default gen_random_uuid()`
- `mongo_id text unique null`
- `name text not null unique`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### eshra

Same shape as `fabrics`.

### paintings

Same shape as `fabrics`.

### marbles

Same shape as `fabrics`.

### glass

Same shape as `fabrics`.

### products

- `id uuid primary key default gen_random_uuid()`
- `mongo_id text unique null`
- `product_id integer not null unique`
- `name text not null`
- `description text null`
- `supplier_id uuid not null references suppliers(id) on delete restrict`
- `images text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Indexes:
  - unique index on `product_id`
  - index on `supplier_id`
  - optional index on lower `name` if product search becomes server-side

## Product Lookup Join Tables

Mongo stores allowed customization options as arrays on `Product`. In PostgreSQL, represent these as many-to-many join tables:

### product_fabrics

- `product_id uuid not null references products(id) on delete cascade`
- `fabric_id uuid not null references fabrics(id) on delete restrict`
- Primary key: `(product_id, fabric_id)`
- Index: `fabric_id`

### product_eshra

- `product_id uuid not null references products(id) on delete cascade`
- `eshra_id uuid not null references eshra(id) on delete restrict`
- Primary key: `(product_id, eshra_id)`
- Index: `eshra_id`

### product_paintings

- `product_id uuid not null references products(id) on delete cascade`
- `painting_id uuid not null references paintings(id) on delete restrict`
- Primary key: `(product_id, painting_id)`
- Index: `painting_id`

### product_marbles

- `product_id uuid not null references products(id) on delete cascade`
- `marble_id uuid not null references marbles(id) on delete restrict`
- Primary key: `(product_id, marble_id)`
- Index: `marble_id`

### product_glass

- `product_id uuid not null references products(id) on delete cascade`
- `glass_id uuid not null references glass(id) on delete restrict`
- Primary key: `(product_id, glass_id)`
- Index: `glass_id`

## Order Tables

### orders

- `id uuid primary key default gen_random_uuid()`
- `mongo_id text unique null`
- `order_id integer not null unique`
- `status order_status not null default 'New'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Indexes:
  - unique index on `order_id`
  - index on `status`

### order_items

- `id uuid primary key default gen_random_uuid()`
- `order_id uuid not null references orders(id) on delete cascade`
- `product_id uuid not null references products(id) on delete restrict`
- `supplier_id uuid not null references suppliers(id) on delete restrict`
- `description text null`
- `quantity integer not null default 1`
- `position integer not null default 0`
- Constraint: `quantity >= 1`
- Indexes:
  - index on `order_id`
  - index on `product_id`
  - index on `supplier_id`

### order_item_fabrics

- `order_item_id uuid not null references order_items(id) on delete cascade`
- `fabric_id uuid not null references fabrics(id) on delete restrict`
- Primary key: `(order_item_id, fabric_id)`

### order_item_eshra

- `order_item_id uuid not null references order_items(id) on delete cascade`
- `eshra_id uuid not null references eshra(id) on delete restrict`
- Primary key: `(order_item_id, eshra_id)`

### order_item_paintings

- `order_item_id uuid not null references order_items(id) on delete cascade`
- `painting_id uuid not null references paintings(id) on delete restrict`
- Primary key: `(order_item_id, painting_id)`

### order_item_marbles

- `order_item_id uuid not null references order_items(id) on delete cascade`
- `marble_id uuid not null references marbles(id) on delete restrict`
- Primary key: `(order_item_id, marble_id)`

### order_item_glass

- `order_item_id uuid not null references order_items(id) on delete cascade`
- `glass_id uuid not null references glass(id) on delete restrict`
- Primary key: `(order_item_id, glass_id)`

### order_status_history

- `id uuid primary key default gen_random_uuid()`
- `order_id uuid not null references orders(id) on delete cascade`
- `status order_status not null`
- `date timestamptz not null default now()`
- Indexes:
  - index on `(order_id, date desc)`
  - index on `(order_id, status, date desc)`

### order_status_sla

- `order_id uuid not null references orders(id) on delete cascade`
- `status order_status not null`
- `green_days integer null`
- `orange_days integer null`
- `red_days integer null`
- Primary key: `(order_id, status)`
- Constraints:
  - `green_days is null or green_days >= 0`
  - `orange_days is null or orange_days >= 0`
  - `red_days is null or red_days >= 0`
  - optional check to keep `green_days <= orange_days <= red_days` if the business wants that rule. The current code does not enforce this, so do not add it unless confirmed.

# ORM / Query Layer Recommendation

Recommendation: **Prisma**.

Why Prisma fits this project:

- The backend is plain JavaScript ES modules with no existing repository layer. Prisma can be introduced as a small generated client without requiring decorators, classes, or a TypeScript rewrite.
- The domain is CRUD-heavy with clear relations, unique constraints, enums, and nested reads that map well to Prisma `include` queries.
- Prisma migrations provide a clear source of truth for PostgreSQL schema changes, which this project currently lacks.
- Prisma works well in Vercel/serverless when the client is cached carefully, and it can use a standard `DATABASE_URL`.
- The current Mongoose models are compact enough to translate directly into `schema.prisma`.
- Prisma's generated API is easier to adopt here than TypeORM or Sequelize because the current code does not use active-record models, decorators, or class entities.

Alternatives:

- Drizzle is lightweight and excellent for SQL-first projects, but this codebase currently has no query builder abstractions. Prisma will be faster and less error-prone for replacing populate-heavy Mongoose reads.
- TypeORM fits class/entity-heavy architectures, which this project does not currently use.
- Sequelize is mature but heavier and less pleasant for strongly relational nested reads.
- Raw SQL gives maximum control but would add more manual mapping code across controllers and duplicate API/backend trees.

# Migration Steps

1. Freeze behavior before changing database code.
   - Keep `PROJECT_UNDERSTANDING.md` and this plan as reference.
   - Record current API response shapes, especially `_id`, populated product fields, populated supplier fields, and lookup arrays.

2. Add PostgreSQL dependencies without removing MongoDB yet.
   - Add `prisma` as a dev dependency and `@prisma/client` as a runtime dependency in the relevant package layout.
   - Decide whether the project will keep separate `backend` and `api` package installs or consolidate the backend/API layer first.

3. Add Prisma schema and migrations.
   - Create a Prisma schema containing the tables listed above.
   - Create PostgreSQL enum `order_status`.
   - Add migrations for suppliers, lookup tables, products, join tables, orders, order items, order item lookup joins, order status history, and order SLA.
   - Include temporary `mongo_id` columns for migration mapping.

4. Add a PostgreSQL client module.
   - Replace Mongo connection helpers with a Prisma client helper.
   - For local backend, replace `backend/server.js` Mongo connection logic with a lightweight PostgreSQL health/connect check or remove eager connection if Prisma connects lazily.
   - For Vercel, replace `api/app.js` and `api/index.js` connection checks with Prisma-safe initialization.

5. Create mapping functions for API compatibility.
   - Convert PostgreSQL rows to the same response shape the frontend currently expects.
   - During compatibility, return `_id` aliases as strings from `id` or `mongo_id`.
   - Preserve populated shapes such as `product.supplier._id`, lookup arrays with `_id` and `name`, and order item nested relations.

6. Rewrite lookup routes.
   - Replace direct `Model.find`, `new Model().save()`, and `findByIdAndDelete` usage in lookup routes with Prisma queries.
   - Maintain endpoint paths and response shapes.

7. Rewrite supplier controller.
   - Replace `Supplier.create`, `Supplier.find`, `findByIdAndUpdate`, and `findByIdAndDelete`.
   - Preserve 11-digit phone validation through database constraint and request validation.

8. Rewrite product controller.
   - Replace `Product.exists`, supplier existence checks, lookup ID validation, product create/update/delete, and populated reads.
   - Use transactions when creating or updating products plus join table rows.
   - Preserve product lookup validation behavior.

9. Rewrite order controller.
   - Replace `Product.findOne(...).select(...)` with product plus allowed customization joins.
   - Use transactions for order creation, order items, order item customizations, initial status history, and optional SLA rows.
   - Replace Mongoose `pre("save")` status history behavior with explicit controller/service logic.
   - Preserve current status transition behavior expected by `OrderDetailModal.jsx`.

10. Update diagnostics and docs.
   - Replace Mongo-specific diagnostics in `api/health.js`, `api/debug.js`, `api/dbstatus.js`, `api/mongo-debug.js`, and `api/check-mongo-env.js`.
   - Rename or remove Mongo-specific diagnostic endpoints only after deployment workflows are updated.
   - Update `DEPLOYMENT.md`, `deploy-vercel.md`, and any custom domain/deployment notes that mention MongoDB.

11. Update frontend only where necessary.
   - Preferred first phase: keep `_id` compatibility in API responses so frontend changes are minimal.
   - Later cleanup: move frontend from `_id` to `id` consistently across pages and modals.

12. Add tests before removing MongoDB.
   - Add focused backend tests for supplier CRUD, lookup CRUD, product create/update validation, order create validation, status updates, status history, SLA updates, and populated response shape.
   - Add at least one migration script dry run against sample exported Mongo data.

13. Run dual validation.
   - Export a snapshot from MongoDB.
   - Import into PostgreSQL staging.
   - Compare counts and representative API responses between Mongo and PostgreSQL implementations.

14. Cut over.
   - Set `DATABASE_URL` in local and Vercel environments.
   - Deploy PostgreSQL-backed API.
   - Monitor create/update/delete flows and diagnostic endpoints.
   - Remove Mongoose dependencies and Mongo files only after PostgreSQL behavior is confirmed.

# Files To Change

## Package And Configuration Files

- `package.json`
- `package-lock.json`
- `backend/package.json`
- `backend/package-lock.json`
- `api/package.json`
- `api/package-lock.json`
- Add a Prisma schema location, likely `prisma/schema.prisma` at the repo root or inside the server package chosen for consolidation.
- Add migration files generated by Prisma.

## Connection / App Initialization

- `backend/server.js`
- `api/app.js`
- `api/index.js`
- `api/_shared/db.js`

## Models To Replace

- `backend/models/productModel.js`
- `api/models/productModel.js`
- `backend/models/Ordermodel.js`
- `api/models/Ordermodel.js`
- `backend/models/SupplierModel.js`
- `api/models/SupplierModel.js`
- `backend/models/Fabric.js`
- `api/models/Fabric.js`
- `backend/models/Eshra.js`
- `api/models/Eshra.js`
- `backend/models/Painting.js`
- `api/models/Painting.js`
- `backend/models/Marble.js`
- `api/models/Marble.js`
- `backend/models/Glass.js`
- `api/models/Glass.js`

## Controllers / Routes To Rewrite

- `backend/controllers/productController.js`
- `api/controllers/productController.js`
- `backend/controllers/OrderController.js`
- `api/controllers/OrderController.js`
- `backend/controllers/SupplierController.js`
- `api/controllers/SupplierController.js`
- `backend/routes/FabricRoute.js`
- `api/routes/FabricRoute.js`
- `backend/routes/EshraRoute.js`
- `api/routes/EshraRoute.js`
- `backend/routes/PaintingRoute.js`
- `api/routes/PaintingRoute.js`
- `backend/routes/MarbleRoute.js`
- `api/routes/MarbleRoute.js`
- `backend/routes/GlassRoute.js`
- `api/routes/GlassRoute.js`

Route modules that may not need path changes but must be retested:

- `backend/routes/ProductRoute.js`
- `api/routes/ProductRoute.js`
- `backend/routes/OrderRoute.js`
- `api/routes/OrderRoute.js`
- `backend/routes/SupplierRoute.js`
- `api/routes/SupplierRoute.js`

## Diagnostics And Docs

- `api/health.js`
- `api/debug.js`
- `api/dbstatus.js`
- `api/mongo-debug.js`
- `api/check-mongo-env.js`
- `api/test-imports.js`
- `DEPLOYMENT.md`
- `deploy-vercel.md`
- `PROJECT_UNDERSTANDING.md`
- This file after implementation details are finalized.

## Frontend Files With `_id` / ObjectId Shape Assumptions

These may not need immediate changes if the API preserves `_id` aliases, but they must be checked:

- `frontend/src/pages/LookupManager.jsx`
- `frontend/src/pages/ProductList.jsx`
- `frontend/src/pages/SupplierList.jsx`
- `frontend/src/pages/OrderList.jsx`
- `frontend/src/pages/OrderDashboard.jsx`
- `frontend/src/components/AddOrderModal.jsx`
- `frontend/src/components/AddProductModal.jsx`
- `frontend/src/components/ProductModal.jsx`
- `frontend/src/components/SupplierModal.jsx`
- `frontend/src/components/ProductDetailModal.jsx`

# Environment Variables

## Current MongoDB Variables

- `MONGO_URI`
  - Used by `backend/server.js`, `api/app.js`, `api/_shared/db.js`, `api/health.js`, `api/debug.js`, `api/dbstatus.js`, `api/mongo-debug.js`, and `api/check-mongo-env.js`.
  - Documented in `DEPLOYMENT.md` and `deploy-vercel.md`.
- Existing non-database variables to keep:
  - `NODE_ENV`
  - `FRONTEND_URL`
  - `VERCEL`
  - `BACKEND_URL` for Vite proxying in `frontend/vite.config.js`.

## New PostgreSQL Variables

- `DATABASE_URL`
  - Standard Prisma/PostgreSQL connection string.
  - Example: `postgresql://user:password@host:5432/database?schema=public`
- Optional deployment-specific variables:
  - `DIRECT_DATABASE_URL` if Prisma migrations need a direct non-pooled connection.
  - `POSTGRES_URL` only if the selected host provides that name and the app maps it to `DATABASE_URL`.
  - `PGSSLMODE=require` or equivalent connection-string SSL parameter if the host requires SSL.

After migration, remove `MONGO_URI` from Vercel/local documentation only when no Mongo diagnostic or rollback path still needs it.

# Data Migration Strategy

1. Prepare PostgreSQL schema first.
   - Run Prisma migrations against an empty PostgreSQL database.
   - Keep `mongo_id` columns to map existing ObjectId strings.

2. Export MongoDB data.
   - Use `mongoexport` or a Node migration script using the current Mongoose models.
   - Export collections for products, orders, suppliers, fabrics, eshra, paintings, marbles, and glass.
   - Preserve `_id`, `createdAt`, and `updatedAt`.

3. Import lookup tables and suppliers first.
   - Insert suppliers with `mongo_id = _id.toString()`.
   - Insert fabrics, eshra, paintings, marbles, and glass with `mongo_id = _id.toString()`.
   - Verify unique `name` constraints do not conflict.

4. Import products.
   - Insert products with `mongo_id`, `product_id`, `supplier_id` resolved from supplier `mongo_id`, text fields, images, and timestamps.
   - Insert product customization join rows by resolving each lookup ObjectId through its table's `mongo_id`.

5. Import orders.
   - Insert orders with `mongo_id`, `order_id`, `status`, and timestamps.
   - Insert `order_status_history` from embedded `statusHistory`.
   - Insert `order_status_sla` rows from nested `statusSla`.
   - Insert `order_items` for each embedded item, preserving item order in `position`.
   - Insert order item lookup join rows by resolving ObjectId arrays through lookup `mongo_id`.

6. Validate counts and relations.
   - Compare Mongo collection counts to PostgreSQL table counts.
   - Compare join counts for product lookup joins and order item lookup joins.
   - Query sample products/orders through the new API and compare response shape to the old API.

7. Cutover with a short write freeze.
   - Stop writes to MongoDB.
   - Run final export/import delta or full re-import.
   - Switch environment from `MONGO_URI` to `DATABASE_URL`.
   - Deploy PostgreSQL-backed API.

8. Keep rollback data.
   - Keep MongoDB read-only backup and export files until PostgreSQL production behavior is verified.
   - Do not remove `mongo_id` mapping columns until rollback and audit needs are resolved.

# Risks

- Relation mapping risk: Mongo embedded arrays and ObjectId refs must be split into normalized tables and join tables. Missed joins will break product customization and order item detail views.
- ObjectId replacement risk: frontend code expects `_id` fields. A direct switch to `id` will break keys, select values, update URLs, and delete URLs unless compatibility aliases or frontend updates are added.
- Status history risk: Mongoose currently appends status history in a `pre("save")` hook. PostgreSQL will not do this automatically unless implemented in controller/service logic or database triggers.
- Transaction risk: product updates and order creation touch multiple tables. PostgreSQL implementation must use transactions to avoid partial writes.
- Index/constraint risk: Mongo unique indexes on `productId`, `orderId`, and lookup `name` must become PostgreSQL unique constraints. Supplier phone regex should become a check constraint plus request validation.
- Query behavior risk: Mongoose `.populate()` currently returns nested objects. PostgreSQL queries must deliberately rebuild the same nested response shape.
- Delete behavior risk: Mongo currently deletes lookup records without checking references. PostgreSQL foreign keys with `on delete restrict` will block deletes that would orphan products/orders. This is safer but can change behavior.
- Status enum risk: `getOrdersByStatus` currently rejects `finished`, while the model and frontend support it. PostgreSQL enum should include `finished`, but endpoint behavior should be deliberately decided.
- Serverless connection risk: Prisma/PostgreSQL connection handling must be configured for Vercel to avoid exhausting connections. Use pooling or provider guidance.
- Deployment risk: `api` and `backend` duplicate domain files. Migrating only one side can make local and Vercel behavior diverge.
- Diagnostic exposure risk: Mongo debug endpoints currently expose URI metadata and connection details. PostgreSQL diagnostics should avoid leaking sensitive connection information.
- Data type risk: Mongo dates and numbers may contain unexpected values not captured by Mongoose validation. Migration scripts should validate before insert.
- Ordering risk: Mongo embedded `items` arrays have implicit order. PostgreSQL should preserve this with `order_items.position`.
- Case/naming risk: Existing API route names are inconsistent and case-sensitive. Database migration should not rename routes unless all frontend callers are updated together.
