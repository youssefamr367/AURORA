export {
  createLookup,
  listLookup,
} from "../modules/lookups/lookup.service.js";
export { mapLookupEntity as mapLookup } from "../modules/lookups/lookup.entity.js";

export {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from "../modules/suppliers/supplier.service.js";
export { mapSupplierEntity as mapSupplier } from "../modules/suppliers/supplier.entity.js";

export {
  createProduct,
  deleteProduct,
  getProductByProductId,
  listProducts,
  updateProduct,
} from "../modules/products/product.service.js";

export {
  createOrder,
  deleteOrder,
  fixExistingOrders,
  getOrderByOrderId,
  getOrderStatusHistory,
  listOrders,
  updateOrder,
} from "../modules/orders/order.service.js";

export async function deleteLookup(table, id, label) {
  const deleted = await import("../modules/lookups/lookup.service.js").then(
    (mod) => mod.deleteLookup(table, id)
  );
  if (!deleted) return null;
  return { message: `${label} deleted` };
}
