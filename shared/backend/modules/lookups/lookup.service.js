import { mapLookupEntity } from "./lookup.entity.js";
import {
  deleteLookupRecord,
  insertLookup,
  selectLookups,
} from "./lookup.repository.js";

export async function createLookup(table, body) {
  return mapLookupEntity(await insertLookup(table, body));
}

export async function listLookup(table) {
  const rows = await selectLookups(table);
  return rows.map(mapLookupEntity);
}

export async function deleteLookup(table, id) {
  return mapLookupEntity(await deleteLookupRecord(table, id));
}
