import { mapBase } from "../../../db/postgresCore.js";

export function mapLookupEntity(row) {
  if (!row) return null;

  return {
    ...mapBase(row),
    name: row.name,
  };
}
