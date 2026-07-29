import { mapBase } from "../../../db/postgresCore.js";

export const SUPPLIER_TABLE = "suppliers";

export function mapSupplierEntity(row) {
  if (!row) return null;

  return {
    ...mapBase(row),
    name: row.name,
    number: row.number,
  };
}
