import { mapSupplierEntity } from "./supplier.entity.js";
import {
  deleteSupplierRecord,
  insertSupplier,
  selectSuppliers,
  updateSupplierRecord,
} from "./supplier.repository.js";

export async function createSupplier(body) {
  return mapSupplierEntity(await insertSupplier(body));
}

export async function listSuppliers() {
  const rows = await selectSuppliers();
  return rows.map(mapSupplierEntity);
}

export async function updateSupplier(id, body) {
  return mapSupplierEntity(await updateSupplierRecord(id, body));
}

export async function deleteSupplier(id) {
  return mapSupplierEntity(await deleteSupplierRecord(id));
}
