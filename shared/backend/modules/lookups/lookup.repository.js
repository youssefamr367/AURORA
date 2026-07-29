import { query } from "../../../db/postgresCore.js";

export async function insertLookup(table, body) {
  const { rows } = await query(
    `insert into ${table} (name) values ($1) returning *`,
    [body.name]
  );

  return rows[0] ?? null;
}

export async function selectLookups(table) {
  const { rows } = await query(`select * from ${table} order by name`);
  return rows;
}

export async function deleteLookupRecord(table, id) {
  const { rows } = await query(
    `delete from ${table} where id = $1 returning *`,
    [id]
  );

  return rows[0] ?? null;
}
