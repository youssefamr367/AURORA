import { query, transaction } from "../../../db/postgresCore.js";
import { LOOKUPS } from "../_shared/lookupConfig.js";
import {
  mapProductBase,
  mapProductLookupRows,
} from "./product.entity.js";

async function fetchProductLookups(client, productId) {
  const out = {};

  for (const [field, cfg] of Object.entries(LOOKUPS)) {
    const { rows } = await client.query(
      `select l.* from ${cfg.table} l
       join ${cfg.join} j on j.${cfg.productKey} = l.id
       where j.product_id = $1
       order by l.name`,
      [productId]
    );
    out[field] = mapProductLookupRows(rows);
  }

  return out;
}

async function mapProductRow(client, row) {
  if (!row) return null;
  return { ...mapProductBase(row), ...(await fetchProductLookups(client, row.id)) };
}

async function productByClause(client, clause, params) {
  const { rows } = await client.query(
    `select p.*, s.name as supplier_name, s.number as supplier_number,
            s.created_at as supplier_created_at, s.updated_at as supplier_updated_at
     from products p
     join suppliers s on s.id = p.supplier_id
     where ${clause}
     limit 1`,
    params
  );

  return mapProductRow(client, rows[0]);
}

export async function validateLookupIds(client, field, ids) {
  if (!ids) return [];
  if (!Array.isArray(ids)) throw new Error(`${field} must be an array`);
  if (ids.length === 0) return [];

  const cfg = LOOKUPS[field];
  const { rows } = await client.query(
    `select id from ${cfg.table} where id = any($1::uuid[])`,
    [ids]
  );

  if (rows.length !== ids.length) {
    throw new Error(`One or more ${field} IDs are invalid`);
  }

  return ids;
}

export async function replaceProductLookups(client, productId, payload) {
  for (const [field, cfg] of Object.entries(LOOKUPS)) {
    if (!(field in payload)) continue;

    const ids = await validateLookupIds(client, field, payload[field]);
    await client.query(`delete from ${cfg.join} where product_id = $1`, [
      productId,
    ]);

    for (const id of ids) {
      await client.query(
        `insert into ${cfg.join} (product_id, ${cfg.productKey}) values ($1, $2) on conflict do nothing`,
        [productId, id]
      );
    }
  }
}

export async function createProductRecord(body) {
  return transaction(async (client) => {
    const existing = await client.query(
      "select id from products where product_id = $1",
      [body.productId]
    );
    if (existing.rows[0]) throw new Error("Product ID already exists.");

    const supplier = await client.query(
      "select id from suppliers where id = $1",
      [body.supplier]
    );
    if (!supplier.rows[0]) throw new Error("Invalid supplier ID");

    for (const field of Object.keys(LOOKUPS)) {
      await validateLookupIds(client, field, body[field]);
    }

    const { rows } = await client.query(
      `insert into products (product_id, name, description, supplier_id, images)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [
        body.productId,
        body.name,
        body.description ?? null,
        body.supplier,
        body.images ?? null,
      ]
    );

    await replaceProductLookups(client, rows[0].id, body);
    return productByClause(client, "p.id = $1", [rows[0].id]);
  });
}

export async function listProductRecords() {
  return transaction(async (client) => {
    const { rows } = await client.query(
      `select p.*, s.name as supplier_name, s.number as supplier_number,
              s.created_at as supplier_created_at, s.updated_at as supplier_updated_at
       from products p
       join suppliers s on s.id = p.supplier_id
       order by p.created_at desc`
    );

    const products = [];
    for (const row of rows) {
      products.push(await mapProductRow(client, row));
    }
    return products;
  });
}

export async function selectProductByProductId(productId) {
  return transaction((client) =>
    productByClause(client, "p.product_id = $1", [productId])
  );
}

export async function updateProductRecord(productId, body) {
  return transaction(async (client) => {
    const current = await client.query(
      "select * from products where product_id = $1",
      [productId]
    );
    if (!current.rows[0]) return null;

    if (body.supplier) {
      const supplier = await client.query(
        "select id from suppliers where id = $1",
        [body.supplier]
      );
      if (!supplier.rows[0]) throw new Error("Invalid supplier ID");
    }

    for (const field of Object.keys(LOOKUPS)) {
      if (field in body) {
        await validateLookupIds(client, field, body[field]);
      }
    }

    await client.query(
      `update products
       set name = coalesce($2, name),
           description = $3,
           supplier_id = coalesce($4, supplier_id),
           images = $5,
           updated_at = now()
       where product_id = $1`,
      [
        productId,
        body.name ?? null,
        "description" in body ? body.description : current.rows[0].description,
        body.supplier ?? null,
        "images" in body ? body.images : current.rows[0].images,
      ]
    );

    await replaceProductLookups(client, current.rows[0].id, body);
    return productByClause(client, "p.product_id = $1", [productId]);
  });
}

export async function deleteProductRecord(productId) {
  const { rows } = await query(
    "delete from products where product_id = $1 returning *",
    [productId]
  );
  return rows[0] ?? null;
}
