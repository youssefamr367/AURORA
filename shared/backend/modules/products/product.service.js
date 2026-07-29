import {
  createProductRecord,
  deleteProductRecord,
  listProductRecords,
  selectProductByProductId,
  updateProductRecord,
} from "./product.repository.js";

export async function createProduct(body) {
  return createProductRecord(body);
}

export async function listProducts() {
  return listProductRecords();
}

export async function getProductByProductId(productId) {
  return selectProductByProductId(productId);
}

export async function updateProduct(productId, body) {
  return updateProductRecord(productId, body);
}

export async function deleteProduct(productId) {
  return deleteProductRecord(productId);
}
