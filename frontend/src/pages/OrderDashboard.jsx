import { useEffect, useState, useCallback } from "react";
// @ts-ignore
import * as XLSX from "xlsx";
import OrderDetailModal from "../components/OrderDetailModal.jsx";
import { getJson } from "../shared/api/client.js";
import {
  getStatusColor,
  getStatusDate,
  isOverdue,
  ORDER_TABS,
} from "../features/orders/orderStatus.js";
import PageState from "../shared/ui/PageState.jsx";
import "../CSS/OrderDashboard.css";

const OrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("New");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const json = await getJson("/api/Order/getAllOrders");
      setOrders(json);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError(err.message || "Failed to load dashboard orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const overdueCount = orders.filter(isOverdue).length;

  const visible = orders
    .filter((order) => order.status === activeTab)
    .filter((order) => order.orderId.toString().includes(searchTerm.trim()));

  const exportToExcel = () => {
    const rows = visible.map((order) => ({
      "Order ID": order.orderId,
      "Created Date": new Date(order.createdAt).toISOString().split("T")[0],
      "Status Date": new Date(getStatusDate(order)).toISOString().split("T")[0],
      Status: order.status,
      Products: order.items.map((item) => item.product?.name).join(", "),
      Notes: order.notes || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "orders.xlsx");
  };

  return (
    <div className="OrderDashboard">
      <h1>Furniture Orders Dashboard</h1>

      {overdueCount > 0 && (
        <div className="alert-banner">
          {overdueCount} overdue orders need attention
        </div>
      )}

      <div className="summary-cards">
        <div className="card new">
          <h3>New Orders</h3>
          <p>{orders.filter((order) => order.status === "New").length}</p>
        </div>
        <div className="card manufacturing">
          <h3>In Manufacturing</h3>
          <p>{orders.filter((order) => order.status === "manufacturing").length}</p>
        </div>
        <div className="card ready">
          <h3>Ready to Move</h3>
          <p>{orders.filter((order) => order.status === "Done").length}</p>
        </div>
      </div>

      <div className="controls-row">
        <div className="tabs">
          {ORDER_TABS.map((tab) => (
            <button
              key={tab.value}
              className={tab.value === activeTab ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="search-export">
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button className="export-btn" onClick={exportToExcel}>
            Export
          </button>
        </div>
      </div>

      {loading && (
        <PageState
          title="Loading dashboard"
          description="We are gathering the latest order activity."
          className="no-results"
        />
      )}

      {!loading && error && (
        <PageState
          variant="error"
          title="Could not load dashboard orders"
          description={error}
          className="no-results"
        />
      )}

      {!loading && !error && (
        <>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Created Date</th>
                <th>Status Date</th>
                <th>Status</th>
                <th>Products</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="no-results">
                    No orders to display.
                  </td>
                </tr>
              )}
              {visible.map((order) => (
                <tr
                  key={order._id}
                  className={`${isOverdue(order) ? "overdue" : ""} ${getStatusColor(order)}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <td>{order.orderId}</td>
                  <td>{new Date(order.createdAt).toISOString().split("T")[0]}</td>
                  <td>{new Date(getStatusDate(order)).toISOString().split("T")[0]}</td>
                  <td>{order.status}</td>
                  <td>{order.items.map((item) => item.product?.name).join(", ")}</td>
                  <td>{order.notes || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="orders-table-mobile">
            {visible.length === 0 && (
              <PageState
                title={searchTerm.trim() ? "No matching orders" : `No ${activeTab.toLowerCase()} orders`}
                description={
                  searchTerm.trim()
                    ? "Try another order ID."
                    : "Orders will appear here as they move through the workflow."
                }
                className="no-results"
              />
            )}
            {visible.map((order) => (
              <div
                key={order._id}
                className={`order-card-mobile ${isOverdue(order) ? "overdue" : ""} ${getStatusColor(order)}`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="card-row">
                  <span className="card-label">Order ID:</span>
                  <span className="card-value">{order.orderId}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">Created:</span>
                  <span className="card-value">
                    {new Date(order.createdAt).toISOString().split("T")[0]}
                  </span>
                </div>
                <div className="card-row">
                  <span className="card-label">Status Date:</span>
                  <span className="card-value">
                    {new Date(getStatusDate(order)).toISOString().split("T")[0]}
                  </span>
                </div>
                <div className="card-row">
                  <span className="card-label">Status:</span>
                  <span className="card-value">{order.status}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">Products:</span>
                  <span className="card-value">
                    {order.items.map((item) => item.product?.name).join(", ")}
                  </span>
                </div>
                {order.notes && (
                  <div className="card-row">
                    <span className="card-label">Notes:</span>
                    <span className="card-value">{order.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          refreshList={fetchOrders}
        />
      )}
    </div>
  );
};

export default OrderDashboard;
