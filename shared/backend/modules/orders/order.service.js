import {
  createOrderRecord,
  deleteOrderRecord,
  listOrderRecords,
  selectOrderByOrderId,
  selectOrderStatusHistory,
  updateOrderRecord,
} from "./order.repository.js";

export async function createOrder(body) {
  return createOrderRecord(body);
}

export async function listOrders(status) {
  return listOrderRecords(status);
}

export async function getOrderByOrderId(orderId) {
  return selectOrderByOrderId(orderId);
}

export async function updateOrder(orderId, body) {
  return updateOrderRecord(orderId, body);
}

export async function deleteOrder(orderId) {
  return deleteOrderRecord(orderId);
}

export async function getOrderStatusHistory(orderId) {
  return selectOrderStatusHistory(orderId);
}

export async function fixExistingOrders() {
  return {
    message:
      "No PostgreSQL repair needed; status history is stored in order_status_history.",
  };
}
