# Current Project Understanding

This project is a furniture/order management application. It manages suppliers, products, customization lookup values, orders, order status history, per-order SLA thresholds, dashboard views, and Excel export.

The frontend is a React/Vite app. `frontend/src/App.jsx` defines the main routes: `/` for `OrderDashboard`, `/products` for `ProductList`, `/orders` for `OrderList`, `/suppliers` for `SupplierList`, and `/Materials` for `LookupManager`. Pages and modals call APIs directly with relative `fetch("/api/...")` URLs, for example in `frontend/src/pages/OrderDashboard.jsx`, `frontend/src/components/AddOrderModal.jsx`, `frontend/src/components/ProductModal.jsx`, and `frontend/src/pages/LookupManager.jsx`.

The backend is currently split into two similar server paths. Local development starts from `backend/server.js`. Vercel serverless requests go through `api/index.js` and `api/app.js`. Domain controllers exist in both `backend/controllers/*` and `api/controllers/*`, and route modules exist in both `backend/routes/*` and `api/routes/*`.

The current database layer is PostgreSQL. The schema is in `database/postgresql_schema.sql`, the local database pool is in `backend/db/postgres.js`, and the current raw SQL repository is concentrated in `backend/db/repository.js`. The Vercel API has matching files under `api/db/*`. API responses still preserve `_id` aliases for frontend compatibility.

The repo is currently in a mid-migration/dirty worktree state. Many PostgreSQL migration files are modified or untracked, including `backend/db/*`, `api/db/*`, `database/postgresql_schema.sql`, package files, deleted old model files, and documentation files.

# Current Problems

## Backend / Architecture

- `backend` and `api` duplicate route, controller, and database logic. Changes must currently be mirrored across `backend/controllers/*`, `api/controllers/*`, `backend/routes/*`, `api/routes/*`, `backend/db/*`, and `api/db/*`.
- `backend/db/repository.js` is too large and mixes SQL queries, validation, transaction orchestration, response mapping, and business rules in one module.
- Controllers such as `backend/controllers/OrderController.js`, `backend/controllers/productController.js`, and `backend/controllers/SupplierController.js` repeat `try/catch` blocks and response mapping.
- Lookup routes such as `backend/routes/FabricRoute.js`, `backend/routes/EshraRoute.js`, and matching `api/routes/*` still implement controller-like behavior inline.
- API route names are inconsistent and legacy-shaped, for example `/api/Product/getAllProduct` and `/api/Order/updateByProductId/:orderId`.
- There is no authentication or authorization layer.
- Errors are inconsistent and mostly returned as `{ message: err.message }`.
- Console logging is used directly in `backend/server.js`, `api/app.js`, `api/index.js`, and diagnostic endpoints.
- Diagnostic endpoints such as `api/debug.js`, `api/dbstatus.js`, `api/postgres-debug.js`, and `api/list-files.js` may expose operational information and should be reviewed before production use.
- No automated backend tests were found.

## Database

- PostgreSQL schema exists in `database/postgresql_schema.sql`, but there is no versioned migration tool or migration history.
- Raw SQL is concentrated in `backend/db/repository.js` and duplicated in `api/db/repository.js`.
- Nested reads in `backend/db/repository.js` fetch related lookup rows inside loops, which can become N+1 style work as data grows.
- API compatibility `_id` aliases are necessary for the current frontend but should be isolated in DTO/mapper code.
- PostgreSQL delete constraints may behave differently than the old MongoDB delete behavior, especially for lookup values referenced by products or orders.
- Database connection behavior is split between `backend/db/postgres.js`, `api/db/postgres.js`, `backend/server.js`, and `api/app.js`.

## Frontend / UI UX

- API calls are repeated across pages and modals using direct `fetch`, including `frontend/src/pages/ProductList.jsx`, `SupplierList.jsx`, `OrderList.jsx`, `OrderDashboard.jsx`, `LookupManager.jsx`, and modal components.
- Form state, loading state, delete state, and error handling are duplicated across `AddOrderModal.jsx`, `AddProductModal.jsx`, `ProductModal.jsx`, `SupplierModal.jsx`, and `OrderDetailModal.jsx`.
- Browser `alert` and `window.confirm` are used in `LookupManager.jsx`, `ProductModal.jsx`, `SupplierModal.jsx`, and `OrderDetailModal.jsx`.
- Inline error styles exist in modal components instead of shared alert components.
- Status/SLA logic is duplicated between `frontend/src/pages/OrderDashboard.jsx`, `frontend/src/pages/OrderList.jsx`, and `frontend/src/components/OrderDetailModal.jsx`.
- Several UI strings contain mojibake artifacts such as `Ã—`, `â€”`, and broken emoji sequences.
- Loading states, empty states, and user feedback are basic or inconsistent.
- Accessibility is partial: modals use `role="dialog"` in places, but focus management, keyboard behavior, confirm flows, and form error announcements need improvement.
- CSS is split by files in `frontend/src/CSS`, but shared patterns like `aom-*` are reused informally rather than through a small design system.

## Security / Maintainability

- No authentication/authorization means any user with access can create, update, or delete suppliers, products, orders, and lookup values.
- Secrets are loaded from `.env`, but diagnostics and error payloads should avoid exposing connection details.
- The current structure makes future changes risky because business rules, SQL, DTO mapping, and compatibility behavior are not clearly separated.

# Backend Refactor Plan

## Folder Structure

Move toward one shared backend implementation consumed by both local and Vercel entrypoints. The target should be a feature/module structure where each business service owns its own folder.

Each service/module should have its own folder that includes:

- `entity` or `entity.js`: domain shape, constants, status values, field names, and entity-level helpers.
- `repository` or `repository.js`: database-only queries for that service.
- `service` or `service.js`: business rules, transaction orchestration, validation coordination, and workflow logic.
- `controller` or `controller.js`: HTTP request/response handling only.
- `routes` or `routes.js`: Express route registration.
- `validation` or `validation.js`: request DTO validation schemas.
- `mapper` or `mapper.js`: response DTO mapping, including current `_id` compatibility.

Recommended target example:

```text
backend/src/
  app.js
  config/
  db/
  middleware/
  modules/
    orders/
      order.entity.js
      order.repository.js
      order.service.js
      order.controller.js
      order.routes.js
      order.validation.js
      order.mapper.js
    products/
      product.entity.js
      product.repository.js
      product.service.js
      product.controller.js
      product.routes.js
      product.validation.js
      product.mapper.js
    suppliers/
      supplier.entity.js
      supplier.repository.js
      supplier.service.js
      supplier.controller.js
      supplier.routes.js
      supplier.validation.js
      supplier.mapper.js
    lookups/
      lookup.entity.js
      lookup.repository.js
      lookup.service.js
      lookup.controller.js
      lookup.routes.js
      lookup.validation.js
      lookup.mapper.js
  utils/
```

The Vercel API should import the shared backend app instead of duplicating domain code under `api/controllers`, `api/routes`, and `api/db`.

## Services / Repositories / Controllers

- Use a strict per-service folder pattern. Each business service must live in its own module folder and include its entity, repository layer, service layer, controller layer, routes, validation, and mapper files together.
- Recommended naming should stay consistent: `*.entity.js`, `*.repository.js`, `*.service.js`, `*.controller.js`, `*.routes.js`, `*.validation.js`, and `*.mapper.js`.
- Move SQL from `backend/db/repository.js` into service-specific repositories.
- Keep repositories focused on database reads/writes only.
- Move business rules such as product option validation, order status history updates, and SLA normalization into service layers.
- Keep controllers thin: parse request, call service, return response.
- Keep route paths stable while refactoring, including legacy names such as `/api/Product/getAllProduct`.

## DTOs And Validation

- Add validation schemas for create/update requests for suppliers, products, orders, lookup values, status updates, and SLA updates.
- Validate IDs, numeric fields, required fields, arrays, status values, and SLA day values before calling repositories.
- Add response mappers that preserve current frontend fields such as `_id`, `productId`, `orderId`, populated `supplier`, lookup arrays, `statusHistory`, and `statusSla`.

## Error Handling

- Add centralized error middleware.
- Introduce typed app errors such as `ValidationError`, `NotFoundError`, `ConflictError`, and `DatabaseError`.
- Return consistent error responses, while preserving existing frontend-readable `message` fields.
- Avoid leaking stack traces or database details in production.

## Authentication / Authorization

- Plan for authentication as a future architecture improvement, not as a current behavior change.
- Add middleware boundaries where authentication can be inserted later.
- Define likely permissions later around read, create, update, delete, and admin lookup management, but do not invent or enforce roles in the first refactor.

## Database Layer

- Keep PostgreSQL as the database.
- Keep `database/postgresql_schema.sql` as the current source until a migration tool is introduced.
- Introduce versioned migrations in a later phase.
- Isolate PostgreSQL pool management in one shared module.
- Replace duplicate `backend/db/postgres.js` and `api/db/postgres.js` with one shared connection module.
- Keep `_id` compatibility mapping at the API boundary, not spread throughout services.

## PostgreSQL Migration Structure

- Create a migrations folder, for example `database/migrations`.
- Convert `database/postgresql_schema.sql` into an initial migration.
- Keep `scripts/run-postgres-schema.js` or replace it with a migration runner.
- Add repeatable setup docs for local and Vercel environments.

## Transactions

- Keep multi-table writes inside transactions.
- Orders must create/update `orders`, `order_items`, order item lookup joins, `order_status_history`, and `order_status_sla` atomically.
- Product create/update must write `products` and product lookup join tables atomically.
- Move transaction boundaries into service layer methods.

## Logging

- Replace direct `console.log` and `console.error` with a small logger utility.
- Include request method, path, status, duration, and request ID.
- Keep debug diagnostics gated by environment.

## API Response Consistency

- Preserve current route paths and response bodies during early refactors.
- Standardize success and error wrappers only if frontend callers are updated together or if compatibility is maintained.
- Keep delete responses compatible, such as `{ message: "Deleted." }` and `{ message: "Order deleted." }`.

## Testing

- Add backend tests around routes and service methods.
- Add regression tests for supplier CRUD, lookup CRUD, product CRUD with lookup joins, order creation, order status transitions, SLA updates, and delete constraints.
- Add tests confirming API compatibility fields like `_id`, `productId`, `orderId`, populated lookup arrays, and `statusHistory`.

# Frontend / UI UX Improvement Plan

## Page Structure

- Keep the current routes in `frontend/src/App.jsx`.
- Organize frontend by features/domains while preserving workflows:
  - `features/orders`
  - `features/products`
  - `features/suppliers`
  - `features/lookups`
  - `shared/api`
  - `shared/ui`
  - `shared/utils`

## Components

- Extract reusable components for modal shell, form field, text input, select, textarea, button, alert, confirmation dialog, tabs, chips, status badge, loading indicator, and empty state.
- Replace informal reuse of `AddOrderModal.css` with a clearer shared UI style layer.
- Preserve existing screens and workflows while improving internals.

## Forms

- Refactor all existing forms so they look more polished and work more reliably, while keeping the current business behavior and submission flows intact.
- Standardize form layouts, spacing, labels, helper text, validation placement, submit areas, and modal sizing across supplier, product, order, and lookup forms.
- Centralize form validation and error display.
- Validate required fields before submit.
- Show field-level messages instead of only generic modal errors.
- Keep current business rules, such as requiring at least one customization before adding an order item.

## Loading States

- Add page-level and component-level loading states for all fetches.
- Disable submit/delete buttons while requests are in progress.
- Show loading or skeleton states in list pages.

## Empty States

- Improve empty states for orders, products, suppliers, and lookups.
- Keep existing messages but make them visually consistent.

## Validation Messages

- Replace browser alerts with inline alerts or toast messages.
- Show server validation messages near the relevant form area.
- Keep network errors clear and actionable.

## Navigation

- Keep current routes and navbar links.
- Improve active route state, mobile navigation, and consistent labels such as `Materials`.

## Responsiveness

- Keep existing desktop table/mobile card approach in `OrderDashboard.jsx`.
- Standardize responsive grids for cards and modal layouts.
- Ensure modal content scrolls properly on small screens.

## Accessibility

- Add focus trapping and focus return for modals.
- Ensure close buttons have accessible labels.
- Use `aria-describedby` for errors and hints.
- Replace browser confirms with accessible confirmation dialogs.
- Ensure tabs and status controls support keyboard navigation.

## User Feedback Messages

- Add a toast/notification system for create/update/delete success and failure.
- Replace `alert()` usage in `frontend/src/pages/LookupManager.jsx`.
- Replace `window.confirm()` usage in `ProductModal.jsx`, `SupplierModal.jsx`, and `OrderDetailModal.jsx`.

## Reusable UI Components

- Create `frontend/src/shared/ui` for generic UI elements.
- Create `frontend/src/shared/api` for one fetch wrapper and endpoint helpers.
- Create `frontend/src/shared/status` or `frontend/src/features/orders/orderStatus.js` for status labels, transitions, SLA defaults, and color logic.

# Target Architecture

The target backend should have one shared implementation and two thin entrypoints:

```text
backend/src/app.js
backend/src/server.js
backend/src/config/*
backend/src/db/*
backend/src/middleware/*
backend/src/modules/orders/*
backend/src/modules/products/*
backend/src/modules/suppliers/*
backend/src/modules/lookups/*
api/index.js
```

`api/index.js` should import the shared app rather than maintaining duplicate controllers, routes, and repositories. Local development should start the same shared app from a local server entrypoint.

Each business service must own its own folder with entity, repository, service layer, controller layer, validation, routes, and mapper files. This keeps business logic, persistence, HTTP handling, and DTO compatibility separated.

The target frontend should remain a React/Vite app but be organized around domains and shared infrastructure:

```text
frontend/src/
  app/
  features/
    orders/
    products/
    suppliers/
    lookups/
  shared/
    api/
    ui/
    hooks/
    utils/
  styles/
```

The target database structure should keep the existing PostgreSQL tables and route-compatible response shape while adding versioned migration management and better query organization.

# Implementation Phases

## Phase 1: Project Understanding And Documentation

- Keep `PROJECT_UNDERSTANDING.md`, `MONGO_TO_POSTGRESQL_MIGRATION_PLAN.md`, and this plan updated.
- Document current API routes and response shapes before refactoring.
- Capture manual regression scenarios for suppliers, lookups, products, orders, dashboard filters, SLA, and status transitions.
- Do not change behavior in this phase.

## Phase 2: Backend Structure Cleanup

- Introduce a shared backend `src` structure.
- Create module folders for each service: orders, products, suppliers, and lookups.
- For each service folder, include entity, repository, service layer, controller layer, routes, validation, and mapper files.
- Move code gradually from `backend/db/repository.js` into module repositories and services.
- Keep old route paths active.

## Phase 3: PostgreSQL Database Migration Hardening

- Convert `database/postgresql_schema.sql` into versioned migrations.
- Keep `scripts/run-postgres-schema.js` until a migration runner replaces it.
- Add indexes and query improvements only after measuring or confirming need.
- Preserve `_id` compatibility until frontend can move safely to `id`.

## Phase 4: API / Service Refactor

- Add DTO validation and response mappers.
- Add centralized error handling.
- Add service-level transactions for products and orders.
- Remove duplicated `api` domain implementation by importing the shared backend app.
- Keep current endpoints stable.

## Phase 5: Frontend Structure Cleanup

- Add a shared API client.
- Move order, product, supplier, and lookup UI code into feature folders.
- Extract shared status/SLA utilities.
- Extract reusable modal/form/button/input components.
- Keep current pages and navigation working.

## Phase 6: UI / UX Improvements

- Refactor all forms across `frontend/src/components/*` and form-driven pages so they have a more consistent visual design and better interaction behavior.
- Replace alerts/confirms with accessible dialogs and toasts.
- Improve loading, empty, and error states.
- Clean mojibake text artifacts.
- Improve responsive modal behavior and dashboard/table/card views.
- Improve accessibility and keyboard behavior.

## Phase 7: Testing And Regression Checks

- Add backend API/service tests.
- Add frontend component or integration tests for key workflows.
- Add build/lint checks to package scripts.
- Create regression checklist for existing business workflows.

## Phase 8: Final Cleanup

- Remove obsolete compatibility code only after callers are updated.
- Remove or secure diagnostic endpoints.
- Remove duplicated files no longer used by local or Vercel runtime.
- Update docs and deployment instructions.

# Files Likely To Change

## Backend / API

- `backend/server.js`
- `api/app.js`
- `api/index.js`
- `backend/db/postgres.js`
- `backend/db/repository.js`
- `api/db/postgres.js`
- `api/db/repository.js`
- `backend/controllers/*`
- `api/controllers/*`
- `backend/routes/*`
- `api/routes/*`
- `api/debug.js`
- `api/dbstatus.js`
- `api/postgres-debug.js`
- `api/list-files.js`
- `api/test-imports.js`
- `package.json`, `backend/package.json`, `api/package.json`

## Database

- `database/postgresql_schema.sql`
- future `database/migrations/*`
- `scripts/run-postgres-schema.js`

## Frontend

- `frontend/src/App.jsx`
- `frontend/src/pages/OrderDashboard.jsx`
- `frontend/src/pages/OrderList.jsx`
- `frontend/src/pages/ProductList.jsx`
- `frontend/src/pages/SupplierList.jsx`
- `frontend/src/pages/LookupManager.jsx`
- `frontend/src/components/AddOrderModal.jsx`
- `frontend/src/components/OrderDetailModal.jsx`
- `frontend/src/components/AddProductModal.jsx`
- `frontend/src/components/ProductModal.jsx`
- `frontend/src/components/AddSupplierModal.jsx`
- `frontend/src/components/SupplierModal.jsx`
- `frontend/src/components/ItemDetailModal.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/CSS/*`
- future `frontend/src/features/*`
- future `frontend/src/shared/*`

## Documentation

- `PROJECT_UNDERSTANDING.md`
- `MONGO_TO_POSTGRESQL_MIGRATION_PLAN.md`
- `DEPLOYMENT.md`
- `deploy-vercel.md`
- `README.md`
- `REFACTOR_AND_IMPROVEMENT_PLAN.md`

# Risks

- Existing API paths are inconsistent but actively used. Renaming `/api/Product/getAllProduct`, `/api/Order/updateByProductId/:orderId`, or similar routes can break the frontend.
- The frontend expects `_id` fields in many places. Removing `_id` compatibility before updating callers will break lists, selects, update requests, and delete requests.
- Order status, SLA, and status history behavior is sensitive. Regressions can affect `OrderDashboard.jsx`, `OrderList.jsx`, and `OrderDetailModal.jsx`.
- Product customization data spans product join tables and order item join tables. Mapping mistakes can break product creation, order creation, and item detail views.
- `backend` and `api` duplication creates divergence risk until a shared backend app is introduced.
- PostgreSQL foreign key delete constraints may block deletes that old behavior allowed.
- UI refactors can easily break modal workflows if form state and refresh callbacks are changed too aggressively.
- There are no automated tests, so refactors need small phases and manual regression checks until test coverage exists.
- Diagnostic endpoints may expose details and should be secured or removed carefully.
- Changing database schema without migration versioning can break deployed environments.

# Rules

- Do not remove existing business functionality.
- Do not invent new business features.
- Preserve current API behavior unless a compatibility plan is included.
- Prefer small safe changes over one large rewrite.
- Keep route compatibility during backend refactors.
- Keep frontend workflow compatibility during UI cleanup.
- Refactor all forms to look better and work better, but keep their current business rules, API payloads, and successful user flows compatible unless a specific migration is planned.
- For every business service, use its own folder with entity, repository, service layer, controller layer, validation, routes, and mapper files.
- Do not place a service's entity, repository, service-layer logic, or controller-layer logic in shared catch-all files once that service has been moved into the target module structure.
