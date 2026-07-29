import { query, transaction } from "../../../db/postgresCore.js";
import { LOOKUPS } from "../_shared/lookupConfig.js";
import {
  mapOrderBase,
  mapOrderLookupRows,
  normalizeSla,
  ORDER_STATUS_VALUES,
} from "./order.entity.js";

let orderSlaSchemaEnsured = false;

async function ensureOrderSlaSchema(client) {
  if (orderSlaSchemaEnsured) return;

  await client.query(
    "alter table if exists order_status_sla add column if not exists due_date timestamptz"
  );
  await client.query(
    "alter table if exists order_status_sla add column if not exists green_date date"
  );
  await client.query(
    "alter table if exists order_status_sla add column if not exists orange_date date"
  );
  await client.query(
    "alter table if exists order_status_sla add column if not exists red_date date"
  );
  orderSlaSchemaEnsured = true;
}

async function assertAllowedOptions(client, productId, field, ids) {
  const incoming = ids || [];
  if (!incoming.length) return;

  const cfg = LOOKUPS[field];
  const { rows } = await client.query(
    `select ${cfg.productKey} as id from ${cfg.join} where product_id = $1`,
    [productId]
  );

  const allowed = new Set(rows.map((row) => row.id));
  const bad = incoming.filter((id) => !allowed.has(id));
  if (bad.length) throw new Error(`Invalid ${field} IDs for product: ${bad}`);
}

async function fetchSla(client, orderId) {
  const { rows } = await client.query(
    "select * from order_status_sla where order_id = $1",
    [orderId]
  );
  const out = {};

  for (const row of rows) {
    const fallbackDate = row.due_date
      ? new Date(row.due_date).toISOString().slice(0, 10)
      : null;

    out[row.status] = {
      greenDate: row.green_date || fallbackDate,
      orangeDate: row.orange_date || fallbackDate,
      redDate: row.red_date || fallbackDate,
    };
  }

  return Object.keys(out).length ? out : undefined;
}

async function fetchStatusHistory(client, orderId) {
  const { rows } = await client.query(
    "select status, date from order_status_history where order_id = $1 order by date asc",
    [orderId]
  );

  return rows.map((row) => ({ status: row.status, date: row.date }));
}

async function fetchOrderItemLookups(client, itemId, field) {
  const cfg = LOOKUPS[field];
  const { rows } = await client.query(
    `select l.* from ${cfg.table} l
     join ${cfg.orderJoin} j on j.${cfg.orderKey} = l.id
     where j.order_item_id = $1
     order by l.name`,
    [itemId]
  );

  return mapOrderLookupRows(rows);
}

async function fetchOrderItems(client, orderId) {
  const { rows } = await client.query(
    `select oi.*, p.product_id as product_code, p.name as product_name,
            p.description as product_description, p.images as product_images,
            p.created_at as product_created_at, p.updated_at as product_updated_at,
            s.name as supplier_name, s.number as supplier_number,
            s.created_at as supplier_created_at, s.updated_at as supplier_updated_at
     from order_items oi
     join products p on p.id = oi.product_id
     join suppliers s on s.id = oi.supplier_id
     where oi.order_id = $1
     order by oi.position, oi.id`,
    [orderId]
  );

  const items = [];
  for (const row of rows) {
    const item = {
      _id: row.id,
      id: row.id,
      product: {
        _id: row.product_id,
        id: row.product_id,
        productId: row.product_code,
        name: row.product_name,
        description: row.product_description,
        images: row.product_images,
        createdAt: row.product_created_at,
        updatedAt: row.product_updated_at,
      },
      supplier: {
        _id: row.supplier_id,
        id: row.supplier_id,
        name: row.supplier_name,
        number: row.supplier_number,
        createdAt: row.supplier_created_at,
        updatedAt: row.supplier_updated_at,
      },
      description: row.description,
      quantity: row.quantity,
    };

    for (const field of Object.keys(LOOKUPS)) {
      item[field] = await fetchOrderItemLookups(client, row.id, field);
    }

    items.push(item);
  }

  return items;
}

async function mapOrderRow(client, row) {
  if (!row) return null;
  return {
    ...mapOrderBase(row),
    items: await fetchOrderItems(client, row.id),
    statusSla: await fetchSla(client, row.id),
    statusHistory: await fetchStatusHistory(client, row.id),
  };
}

async function getOrderByUuid(client, id) {
  const { rows } = await client.query("select * from orders where id = $1", [id]);
  return mapOrderRow(client, rows[0]);
}

export async function createOrderRecord(body) {
  return transaction(async (client) => {
    await ensureOrderSlaSchema(client);

    const { rows } = await client.query(
      "insert into orders (order_id) values ($1) returning *",
      [body.orderId]
    );
    const order = rows[0];

    await client.query(
      "insert into order_status_history (order_id, status, date) values ($1, 'New', now())",
      [order.id]
    );

    for (const sla of normalizeSla(body.statusSla)) {
      await client.query(
        `insert into order_status_sla (order_id, status, green_date, orange_date, red_date)
         values ($1, $2, $3, $4, $5)`,
        [order.id, sla.status, sla.greenDate, sla.orangeDate, sla.redDate]
      );
    }

    for (const [index, item] of (body.items || []).entries()) {
      const productRes = await client.query(
        "select id from products where product_id = $1",
        [item.productId]
      );
      const product = productRes.rows[0];
      if (!product) throw new Error(`Product ${item.productId} not found`);

      for (const field of Object.keys(LOOKUPS)) {
        await assertAllowedOptions(client, product.id, field, item[field]);
      }

      const insertedItem = await client.query(
        `insert into order_items (order_id, product_id, supplier_id, description, quantity, position)
         values ($1, $2, $3, $4, $5, $6)
         returning *`,
        [
          order.id,
          product.id,
          item.supplierId,
          item.description ?? null,
          item.quantity || 1,
          index,
        ]
      );

      for (const [field, cfg] of Object.entries(LOOKUPS)) {
        for (const id of item[field] || []) {
          await client.query(
            `insert into ${cfg.orderJoin} (order_item_id, ${cfg.orderKey}) values ($1, $2) on conflict do nothing`,
            [insertedItem.rows[0].id, id]
          );
        }
      }
    }

    return getOrderByUuid(client, order.id);
  });
}

export async function listOrderRecords(status) {
  return transaction(async (client) => {
    await ensureOrderSlaSchema(client);

    const params = [];
    let where = "";

    if (status) {
      params.push(status);
      where = "where status = $1";
    }

    const { rows } = await client.query(
      `select * from orders ${where} order by created_at desc`,
      params
    );

    const orders = [];
    for (const row of rows) {
      orders.push(await mapOrderRow(client, row));
    }

    return orders;
  });
}

export async function selectOrderByOrderId(orderId) {
  return transaction(async (client) => {
    await ensureOrderSlaSchema(client);

    const { rows } = await client.query(
      "select * from orders where order_id = $1",
      [orderId]
    );
    return mapOrderRow(client, rows[0]);
  });
}

export async function updateOrderRecord(orderId, body) {
  return transaction(async (client) => {
    await ensureOrderSlaSchema(client);

    const currentRes = await client.query(
      "select * from orders where order_id = $1",
      [orderId]
    );
    const current = currentRes.rows[0];
    if (!current) return null;

    if (body.status && !ORDER_STATUS_VALUES.includes(body.status)) {
      throw new Error("Invalid status");
    }

    if (body.status && body.status !== current.status) {
      await client.query(
        "update orders set status = $2, updated_at = now() where id = $1",
        [current.id, body.status]
      );
      const last = await client.query(
        "select status from order_status_history where order_id = $1 order by date desc limit 1",
        [current.id]
      );
      if (!last.rows[0] || last.rows[0].status !== body.status) {
        await client.query(
          "insert into order_status_history (order_id, status, date) values ($1, $2, now())",
          [current.id, body.status]
        );
      }
    }

    if ("statusSla" in body) {
      for (const sla of normalizeSla(body.statusSla)) {
        await client.query(
          `insert into order_status_sla (order_id, status, green_date, orange_date, red_date)
           values ($1, $2, $3, $4, $5)
           on conflict (order_id, status)
           do update set
             green_date = excluded.green_date,
             orange_date = excluded.orange_date,
             red_date = excluded.red_date`,
          [current.id, sla.status, sla.greenDate, sla.orangeDate, sla.redDate]
        );
      }
      await client.query("update orders set updated_at = now() where id = $1", [
        current.id,
      ]);
    }

    return getOrderByUuid(client, current.id);
  });
}

export async function deleteOrderRecord(orderId) {
  const { rows } = await query(
    "delete from orders where order_id = $1 returning *",
    [orderId]
  );
  return rows[0] ?? null;
}

export async function selectOrderStatusHistory(orderId) {
  return transaction(async (client) => {
    await ensureOrderSlaSchema(client);

    const { rows } = await client.query(
      "select id from orders where order_id = $1",
      [orderId]
    );
    if (!rows[0]) return null;
    return fetchStatusHistory(client, rows[0].id);
  });
}
