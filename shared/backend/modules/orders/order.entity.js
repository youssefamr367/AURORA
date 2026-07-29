import { mapBase } from "../../../db/postgresCore.js";
import { mapLookupEntity } from "../lookups/lookup.entity.js";

export const ORDER_STATUS_VALUES = ["New", "manufacturing", "Done", "finished"];
export const SLA_STATUSES = ["New", "manufacturing", "Done"];

function asDateOnly(value) {
  const normalized = value?.trim?.() ?? value;
  if (!normalized) return "";

  const match = String(normalized).match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

export function normalizeSla(raw) {
  const out = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const status of SLA_STATUSES) {
    const value = raw?.[status];
    if (!value) continue;

    const greenDate = asDateOnly(value.greenDate);
    const orangeDate = asDateOnly(value.orangeDate);
    const redDate = asDateOnly(value.redDate);

    if (!greenDate && !orangeDate && !redDate) continue;
    if (!greenDate || !orangeDate || !redDate) {
      throw new Error(`${status} SLA requires green, orange, and red dates`);
    }
    if (greenDate < today) {
      throw new Error(`${status} green SLA date cannot be in the past`);
    }
    if (orangeDate <= greenDate) {
      throw new Error(`${status} orange SLA date must be after green`);
    }
    if (redDate <= orangeDate) {
      throw new Error(`${status} red SLA date must be after orange`);
    }

    out.push({
      status,
      greenDate,
      orangeDate,
      redDate,
    });
  }

  return out;
}

export function mapOrderLookupRows(rows) {
  return rows.map(mapLookupEntity);
}

export function mapOrderBase(row) {
  if (!row) return null;

  return {
    ...mapBase(row),
    orderId: row.order_id,
    status: row.status,
  };
}
