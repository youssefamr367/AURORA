# Project Overview

This project is a furniture/order management application. It manages suppliers, products, product customization options, and customer orders. The frontend provides dashboards, lists, modals, filtering, status updates, SLA coloring, and Excel export. The backend persists data in PostgreSQL through the `pg` driver and exposes Express API routes for local development and Vercel serverless deployment.

The current source of truth is the code itself. The root `README.md` only contains the project name, while deployment behavior is documented in `DEPLOYMENT.md`, `deploy-vercel.md`, and `vercel.json`.

# Tech Stack

- Runtime and package manager: Node.js with npm and `package-lock.json` files at the root, `frontend`, `backend`, and `api`.
- Frontend: React 19, React DOM 19, Vite 7, React Router DOM 7, plain CSS files under `frontend/src/CSS`, and `xlsx` for Excel export.
- Backend: Express 4, PostgreSQL, `pg`, CORS, dotenv, and ES modules.
- Development tooling: root `npm run dev` uses `concurrently` to start backend and frontend. The backend uses `nodemon` for development.
- Linting: frontend ESLint configuration lives in `frontend/eslint.config.js`.
- Deployment: Vercel is configured through `vercel.json`; frontend builds from `frontend/package.json`, while API requests route to `api/index.js`.
- Environment variables found in code/docs: `DATABASE_URL`, `POSTGRES_URL`, `FRONTEND_URL`, `NODE_ENV`, `VERCEL`, and `BACKEND_URL`.

# Folder Structure

- `frontend`: React/Vite application.
  - `frontend/src/main.jsx`: React entry point. It renders `App`.
  - `frontend/src/App.jsx`: Defines browser routes and mounts `Navbar`.
  - `frontend/src/shared/api`: Shared frontend request helpers. `client.js` centralizes JSON request/response handling.
  - `frontend/src/features/orders`: Shared order-domain frontend helpers. `orderStatus.js` centralizes status options, status transitions, SLA normalization, and status-color logic.
  - `frontend/src/features/products`: Product-domain frontend helpers. `api.js` centralizes product API calls and `form.js` centralizes product form loading, validation, payload mapping, and customization helpers.
  - `frontend/src/features/suppliers`: Supplier-domain frontend helpers. `api.js` centralizes supplier API calls and `form.js` centralizes supplier form validation/sanitization.
  - `frontend/src/features/lookups`: Lookup-domain frontend helpers. `api.js` centralizes lookup API calls and lookup-type metadata.
  - `frontend/src/pages`: Route-level screens such as `OrderDashboard.jsx`, `OrderList.jsx`, `ProductList.jsx`, `SupplierList.jsx`, and `LookupManager.jsx`.
  - `frontend/src/components`: Reusable UI pieces and modals such as `AddOrderModal.jsx`, `OrderDetailModal.jsx`, `AddProductModal.jsx`, `ProductModal.jsx`, supplier modals, item detail modal, and navbar.
  - `frontend/src/CSS`: Page/component-specific CSS files. Components import their matching CSS directly.
  - `frontend/vite.config.js`: Vite config, including `/api` proxying to `BACKEND_URL` or `http://localhost:5000`.
- `backend`: Local Express backend.
  - `backend/server.js`: Loads the shared server bootstrap, mounts API routes, serves frontend build in production, and checks PostgreSQL connection.
  - `backend/routes`: Express route modules for products, orders, suppliers, and lookup data.
  - `backend/controllers`: Static class controllers for products, orders, and suppliers.
  - `backend/db`: PostgreSQL connection and SQL repository helpers.
- `api`: Vercel serverless API layer.
  - `api/index.js`: Vercel handler that lazily imports the Express app, initializes routes, ensures DB connection, and forwards requests.
  - `api/app.js`: Serverless Express app with lazy route registration, shared server bootstrap usage, and DB connection helper.
  - `api/routes`, `api/controllers`, `api/db`: Duplicated route/controller/database helper files matching the local backend structure.
  - Diagnostic/helper endpoints include `api/health.js`, `api/debug.js`, `api/dbstatus.js`, `api/postgres-debug.js`, `api/list-files.js`, `api/ping.js`, and `api/root.js`.
- `shared/db`: Shared PostgreSQL helpers used by both local and serverless runtimes.
  - `shared/db/postgresCore.js`: Centralizes pool creation, `DATABASE_URL` resolution, connection checks, query helper, transaction helper, and base DTO mapping.
- `shared/backend/modules`: Shared backend service modules that can be consumed by both local and serverless runtimes.
  - `shared/backend/modules/products`: Shared product module containing `product.entity.js`, `product.repository.js`, `product.service.js`, and `product.controller.js`.
  - `shared/backend/modules/orders`: Shared order module containing `order.entity.js`, `order.repository.js`, `order.service.js`, and `order.controller.js`.
  - `shared/backend/modules/suppliers`: First extracted service module, containing `supplier.entity.js`, `supplier.repository.js`, `supplier.service.js`, and `supplier.controller.js`.
  - `shared/backend/modules/lookups`: Shared lookup module containing `lookup.entity.js`, `lookup.repository.js`, `lookup.service.js`, `lookup.controller.js`, and `lookup.routes.js`.
  - `shared/backend/modules/_shared/lookupConfig.js`: Shared lookup-table and join-table configuration used by product and order modules.
- `shared/backend/compat`: Compatibility export layer.
  - `shared/backend/compat/repository.js`: Preserves the old `backend/db/repository.js` and `api/db/repository.js` export surface while delegating to the shared modules.
- `shared/server`: Shared backend bootstrap helpers used by both local and serverless runtimes.
  - `shared/server/loadEnvironment.js`: Loads root `.env` for both backend entrypoints.
  - `shared/server/createExpressApp.js`: Centralizes JSON parsing, CORS, optional request logging, and optional debug endpoint setup.
  - `shared/server/routeDefinitions.js`: Stores the canonical route labels and mount paths.
  - `shared/server/registerRoutes.js`: Mounts route modules with shared logging/error handling.
- Root docs/config:
  - `vercel.json`: Defines Vercel builds and routes.
  - `DEPLOYMENT.md`, `deploy-vercel.md`, `CUSTOM_DOMAIN_SETUP.md`: Deployment guidance.
  - Root `package.json`: Cross-project scripts for build, start, dev, and Vercel build.

# Application Flow

The frontend starts at `frontend/src/main.jsx`, which renders `frontend/src/App.jsx` inside `React.StrictMode`. `App.jsx` uses `BrowserRouter`, renders `Navbar`, and defines these routes:

- `/`: `OrderDashboard`
- `/products`: `ProductList`
- `/orders`: `OrderList`
- `/suppliers`: `SupplierList`
- `/Materials`: `LookupManager`

Frontend pages and modals use relative `/api/...` URLs. During Vite development, `frontend/vite.config.js` proxies `/api` to `process.env.BACKEND_URL` or `http://localhost:5000`. A first shared frontend request layer now exists in `frontend/src/shared/api/client.js`, and several list/order screens use it instead of repeating raw fetch boilerplate.

For local backend usage, `backend/server.js` now uses the shared helpers in `shared/server/*` to load `.env`, configure the Express app, and mount the existing routes. It still checks PostgreSQL with `ensureDbConnection()` and listens on `process.env.PORT || 5000` when not running on Vercel.

For Vercel usage, `vercel.json` routes `/api/(.*)` to `api/index.js`. `api/index.js` lazily imports `api/app.js`, calls `initRoutes()`, ensures the PostgreSQL connection on each request, and then forwards the request to the Express app. `api/app.js` now uses the same shared bootstrap helpers for base Express setup and route registration.

# Main Modules / Features

- Order dashboard: `frontend/src/pages/OrderDashboard.jsx`
  - Loads all orders from `/api/Order/getAllOrders`.
  - Shows status summary cards, tabs, search, overdue alerting, responsive table/card views, and Excel export through `xlsx`.
  - Opens `OrderDetailModal` for selected orders.
- Order list: `frontend/src/pages/OrderList.jsx`
  - Loads orders, filters by order ID and status, and opens add/detail modals.
- Create order flow: `frontend/src/components/AddOrderModal.jsx`
  - Loads products and suppliers.
  - Filters products by selected supplier.
  - Builds order items with product customizations, quantity, description, supplier, and optional per-order SLA.
  - Submits to `/api/Order/CreateOrder`.
- Order detail/status/SLA flow: `frontend/src/components/OrderDetailModal.jsx`
  - Displays current status, items, status history, and per-order SLA fields.
  - Updates status or SLA through `/api/Order/updateByProductId/:orderId`.
  - Deletes orders through `/api/Order/deleteByOrderId/:orderId`.
- Product management: `frontend/src/pages/ProductList.jsx`, `frontend/src/components/AddProductModal.jsx`, and `frontend/src/components/ProductModal.jsx`
  - Lists, searches, creates, edits, and deletes products.
  - Loads lookup options and suppliers for product customizations.
  - Product forms now share reference-data loading, validation, and payload-building helpers through `frontend/src/features/products/form.js`.
- Supplier management: `frontend/src/pages/SupplierList.jsx`, `frontend/src/components/AddSupplierModal.jsx`, and `frontend/src/components/SupplierModal.jsx`
  - Lists, searches, creates, updates, and deletes suppliers.
  - Supplier forms now share validation and phone sanitization through `frontend/src/features/suppliers/form.js`.
- Lookup/customization management: `frontend/src/pages/LookupManager.jsx`
  - Manages fabrics, eshra, paintings, marbles, and glass through create/list/delete APIs.
- Backend APIs:
  - Product behavior is now implemented in `shared/backend/modules/products/*` and exposed through `backend/controllers/productController.js`, `api/controllers/productController.js`, and the existing product route files.
  - Order behavior is now implemented in `shared/backend/modules/orders/*` and exposed through `backend/controllers/OrderController.js`, `api/controllers/OrderController.js`, and the existing order route files.
  - Supplier behavior is now implemented in `shared/backend/modules/suppliers/*` and exposed through `backend/controllers/SupplierController.js`, `api/controllers/SupplierController.js`, and the existing supplier route files.
  - Lookup behavior is now implemented in `shared/backend/modules/lookups/*` and exposed through the existing lookup route files in `backend/routes/*` and `api/routes/*`.

# Data Models / Entities

- The PostgreSQL schema is defined in `database/postgresql_schema.sql`.
- `products`: UUID primary key, unique numeric `product_id`, `name`, `description`, `supplier_id`, `images`, timestamps, and product-to-lookup join tables.
- `orders`: UUID primary key, unique numeric `order_id`, `status` enum, timestamps, `order_items`, `order_status_history`, and `order_status_sla`.
- `suppliers`: UUID primary key, `name`, 11-digit `number` check constraint, and timestamps.
- Lookup tables: `fabrics`, `eshra`, `paintings`, `marbles`, and `glass`, each with UUID primary key, unique `name`, and timestamps.
- API responses still include `_id` aliases for compatibility with the current frontend.

# APIs / Services / Integrations

- Product routes mounted at `/api/Product` in `backend/server.js` and `api/app.js`:
  - `POST /CreateProduct`
  - `GET /getAllProduct`
  - `GET /GetbyProductId/:productId`
  - `PUT /updateByProductId/:productId`
  - `DELETE /deleteByProductId/:productId`
- Order routes mounted at `/api/Order`:
  - `POST /CreateOrder`
  - `GET /getAllOrders`
  - `GET /GetbyOrderId/:orderId`
  - `GET /byStatus/:status`
  - `GET /statusHistory/:orderId`
  - `GET /fixExistingOrders`
  - `PUT /updateByProductId/:orderId`
  - `DELETE /deleteByOrderId/:orderId`
- Supplier routes mounted at `/api/suppliers`:
  - `POST /create`
  - `GET /all`
  - `PUT /:id`
  - `DELETE /:id`
- Lookup routes:
  - `/api/fabrics`, `/api/eshra`, `/api/paintings`, `/api/marbles`, and `/api/glass`
  - Each supports `POST /create`, `GET /all`, and `DELETE /:id`.
- PostgreSQL integration:
  - Connection pooling now comes from `shared/db/postgresCore.js`, which is re-exported by `backend/db/postgres.js` and `api/db/postgres.js`.
  - `backend/db/repository.js` and `api/db/repository.js` now act as compatibility shims over `shared/backend/compat/repository.js`.
  - Local backend checks PostgreSQL through `backend/server.js`.
  - Serverless connection checks are handled through `api/index.js` and `api/app.js`.
- Vercel diagnostics:
  - `api/health.js`, `api/debug.js`, `api/dbstatus.js`, and `api/postgres-debug.js` expose runtime/database diagnostic information.

# Business Rules Found

- Product IDs are unique through the `Product` schema and explicit duplicate checking in `ProductController.createProduct`.
- Order IDs are unique through the `Order` schema.
- A product must have a valid supplier ID. Product create/update handlers verify supplier existence.
- Product create/update validates lookup option IDs for fabrics, eshra, paintings, marble, and glass using PostgreSQL lookup-table queries.
- Order creation requires each item product to exist by `productId`.
- Order creation verifies selected item customization IDs are allowed by the selected product.
- Order items default `quantity` to `1` if no quantity is provided.
- New orders are created with initial `statusHistory: [{ status: "New", date: new Date() }]`.
- `updateOrder` explicitly appends to `order_status_history` when `status` changes and the last history entry is different.
- Backend status filter endpoint `getOrdersByStatus` accepts `New`, `manufacturing`, `Done`, and `finished`.
- Frontend status transitions in `OrderDetailModal.jsx`:
  - `New` can move to `manufacturing`.
  - `manufacturing` can move back to `New` or forward to `Done`.
  - `Done` can move back to `manufacturing` or forward to `finished`.
  - `finished` can move back to `Done`.
- SLA coloring in `OrderDashboard.jsx` and `OrderList.jsx` uses per-order `statusSla` when present, otherwise frontend defaults:
  - `New`: green 1 day, orange 3 days, red 7 days.
  - `manufacturing`: green 1 day, orange 45 days, red 50 days.
  - `Done`: green 1 day, orange 10 days, red 15 days.
- `AddOrderModal.jsx` requires a product, supplier, and at least one customization before adding an item.

# Coding Patterns

- The codebase uses ES modules (`"type": "module"`) across frontend, backend, and API packages.
- Backend product/order/supplier controllers are classes with static async methods.
- Lookup route modules now use a shared lookup router factory from `shared/backend/modules/lookups/lookup.routes.js`.
- PostgreSQL access is moving into shared backend modules by domain, while `backend/db/repository.js` and `api/db/repository.js` remain as compatibility re-export layers.
- API paths use mixed casing and legacy names, for example `/api/Product/getAllProduct` and `/api/Order/updateByProductId/:orderId`.
- Error handling is mostly `try/catch` with JSON responses shaped like `{ message: err.message }`; some Vercel handlers also return `{ error, message, debug, timestamp }`.
- Logging is done with `console.log` and `console.error`; there is no structured logger.
- Frontend state management is local React state with `useState`, `useEffect`, `useCallback`, and `useMemo`.
- Frontend data loading is in transition from direct `fetch` calls toward `frontend/src/shared/api/client.js`. The first shared usage now covers `OrderDashboard.jsx`, `OrderList.jsx`, `ProductList.jsx`, `SupplierList.jsx`, `AddOrderModal.jsx`, and `OrderDetailModal.jsx`.
- Product, supplier, and lookup screens now also use domain-specific frontend API helper files under `frontend/src/features/*/api.js` so endpoint strings and request boilerplate are less scattered.
- Product create/edit forms now also share domain-specific helper logic for field validation, lookup loading, payload creation, and customization-tag handling.
- Parent list pages pass `refreshList` callbacks into modals so create/update/delete operations can refresh the visible data.
- Modal components commonly track `loading`, `deleting`, `savingSla`, and `error` state locally.
- Supplier create/edit forms now use shared validation plus digit-only phone sanitization before submit, while preserving the same backend payload shape.
- CSS is organized by page/component files under `frontend/src/CSS`, but `AddOrderModal.css` is reused by several modal components as a shared `aom-*` design system.
- Existing code contains some mojibake/unicode display issues in strings and logs. Do not expand this casually when making unrelated changes.
- No automated test suite or test scripts were found.

# How To Add New Refinements Safely

- Add route-level UI screens under `frontend/src/pages` and reusable modal/detail UI under `frontend/src/components`.
- Add or update matching styles in `frontend/src/CSS`, following the existing page/component import pattern.
- Use relative API paths from the frontend, such as `/api/...`, so local Vite proxying and Vercel deployment continue to work.
- Preserve existing endpoint names and casing unless all frontend callers and both backend/API route copies are updated together.
- When changing backend domain behavior, update both `backend` and duplicated `api` route/controller/database files unless the deployment architecture is intentionally changed.
- For new PostgreSQL entities, add schema changes to `database/postgresql_schema.sql` and repository functions in both backend/API database modules.
- For product or order changes, preserve reference validation and populated response shapes expected by frontend modals.
- For order status changes, update status and insert status history in the same transaction.
- Avoid changing the `order_status` enum, `order_status_history`, or `order_status_sla` structure without checking dashboard/list/detail behavior.
- Avoid deleting or renaming diagnostic endpoints until deployment/debug needs are understood.
- Test manually after behavior changes because no automated tests exist. At minimum, verify the affected create/list/edit/delete flow, local API path, and Vercel API path when relevant.
- Add focused tests before or during future risky changes, especially for order creation validation, product option validation, status transitions, and status history.

# Risks / Sensitive Areas

- `backend` and `api` contain duplicated domain files. A fix in only one tree can make local behavior differ from deployed behavior.
- `database/postgresql_schema.sql`, `backend/db/repository.js`, and `api/db/repository.js` are sensitive because table structure, joins, response mapping, status history, and transactions live there.
- `backend/controllers/OrderController.js` and `api/controllers/OrderController.js` are sensitive because order creation validates product option IDs and status updates depend on repository transaction behavior.
- `frontend/src/components/OrderDetailModal.jsx`, `frontend/src/pages/OrderDashboard.jsx`, and `frontend/src/pages/OrderList.jsx` all encode status/SLA assumptions.
- `frontend/src/components/AddOrderModal.jsx` depends on products having supplier data and populated customization arrays.
- `frontend/src/components/AddProductModal.jsx` and `frontend/src/components/ProductModal.jsx` depend on lookup endpoints and supplier response shapes.
- API names and casing are inconsistent but actively used. Renaming routes such as `/api/Product/getAllProduct` or `/api/Order/updateByProductId/:orderId` can break the frontend.
- Vercel diagnostics in `api/debug.js`, `api/postgres-debug.js`, `api/dbstatus.js`, and `api/list-files.js` expose environment or filesystem/debug information. Treat them carefully in production.
- CORS origins in `backend/server.js` and `api/app.js` use `process.env.FRONTEND_URL` plus `"https://*.vercel.app"` in production. Verify behavior before tightening or changing this.
- The backend now expects `DATABASE_URL` or `POSTGRES_URL` for PostgreSQL connectivity.
- There are no tests to catch regressions automatically.

# Open Questions

- Is `backend` intended to remain the local-only server while `api` remains the deployed serverless copy, or should these be consolidated later?
- Should `backend` and `api` database/repository modules be consolidated into one shared server package later?
- Should there be a shared frontend API helper to reduce repeated `fetch` and error-handling code?
- Should order/product/supplier flows get automated tests before deeper refinements?
- Should existing mojibake/unicode display strings be cleaned as a dedicated UI text pass?
