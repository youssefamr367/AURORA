import {
  deleteJson,
  getJson,
  postJson,
  putJson,
} from "../../shared/api/client.js";

export function fetchProducts() {
  return getJson("/api/Product/getAllProduct");
}

export function createProduct(payload) {
  return postJson("/api/Product/CreateProduct", payload);
}

export function updateProduct(productId, payload) {
  return putJson(`/api/Product/updateByProductId/${productId}`, payload);
}

export function deleteProduct(productId) {
  return deleteJson(`/api/Product/deleteByProductId/${productId}`);
}
