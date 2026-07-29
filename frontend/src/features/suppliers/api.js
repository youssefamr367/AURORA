import {
  deleteJson,
  getJson,
  postJson,
  putJson,
} from "../../shared/api/client.js";

export function fetchSuppliers() {
  return getJson("/api/suppliers/all");
}

export function createSupplier(payload) {
  return postJson("/api/suppliers/create", payload);
}

export function updateSupplier(id, payload) {
  return putJson(`/api/suppliers/${id}`, payload);
}

export function deleteSupplier(id) {
  return deleteJson(`/api/suppliers/${id}`);
}
