import {
  createOrder,
  deleteOrder,
  fixExistingOrders,
  getOrderByOrderId,
  getOrderStatusHistory,
  listOrders,
  updateOrder,
} from "./order.service.js";
import { ORDER_STATUS_VALUES } from "./order.entity.js";

class OrderController {
  static async createOrder(req, res) {
    try {
      const order = await createOrder(req.body);
      res.status(201).json(order);
    } catch (err) {
      const status = err.message.includes("not found") ? 404 : 400;
      res.status(status).json({ message: err.message });
    }
  }

  static async getAllOrders(req, res) {
    try {
      res.json(await listOrders());
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async getOrderById(req, res) {
    try {
      const order = await getOrderByOrderId(Number(req.params.orderId));
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async updateOrder(req, res) {
    try {
      const order = await updateOrder(Number(req.params.orderId), req.body);
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async deleteOrder(req, res) {
    try {
      const order = await deleteOrder(Number(req.params.orderId));
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json({ message: "Order deleted." });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async getOrdersByStatus(req, res) {
    try {
      const { status } = req.params;
      if (!ORDER_STATUS_VALUES.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      res.json(await listOrders(status));
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async getOrderStatusHistory(req, res) {
    try {
      const history = await getOrderStatusHistory(Number(req.params.orderId));
      if (!history) return res.status(404).json({ message: "Order not found" });
      res.json(history);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async fixExistingOrders(req, res) {
    try {
      res.json(await fixExistingOrders());
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

export default OrderController;
