import { query } from "../../../db/postgresCore.js";
import { SUPPLIER_TABLE } from "./supplier.entity.js";

export async function insertSupplier(body) {
  const { rows } = await query(
    `insert into ${SUPPLIER_TABLE} (name, number) values ($1, $2) returning *`,
    [body.name, body.number]
  );

  return rows[0] ?? null;
}

export async function selectSuppliers() {
  const { rows } = await query(
    `select * from ${SUPPLIER_TABLE} order by created_at desc`
  );

  return rows;
}

export async function updateSupplierRecord(id, body) {
  const { rows } = await query(
    `update ${SUPPLIER_TABLE}
     set name = coalesce($2, name),
         number = coalesce($3, number),
         updated_at = now()
     where id = $1
     returning *`,
    [id, body.name ?? null, body.number ?? null]
  );

  return rows[0] ?? null;
}

export async function deleteSupplierRecord(id) {
  const { rows } = await query(
    `delete from ${SUPPLIER_TABLE} where id = $1 returning *`,
    [id]
  );

  return rows[0] ?? null;
}
