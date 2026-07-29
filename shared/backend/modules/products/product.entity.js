import { mapBase } from "../../../db/postgresCore.js";
import { mapLookupEntity } from "../lookups/lookup.entity.js";

export function mapProductBase(row) {
  if (!row) return null;

  return {
    ...mapBase(row),
    productId: row.product_id,
    name: row.name,
    description: row.description,
    images: row.images,
    supplier: row.supplier_id
      ? {
          _id: row.supplier_id,
          id: row.supplier_id,
          name: row.supplier_name,
          number: row.supplier_number,
          createdAt: row.supplier_created_at,
          updatedAt: row.supplier_updated_at,
        }
      : null,
  };
}

export function mapProductLookupRows(rows) {
  return rows.map(mapLookupEntity);
}
