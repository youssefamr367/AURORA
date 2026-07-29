import { useState, useEffect, useCallback } from "react";
import OrderDetailModal from "../components/OrderDetailModal.jsx";
import AddOrderModal from "../components/AddOrderModal.jsx";
import { getJson } from "../shared/api/client.js";
import {
  getStatusColor,
  ORDER_STATUS_OPTIONS,
} from "../features/orders/orderStatus.js";
import { useResponsivePageSize } from "../shared/hooks/useResponsivePageSize.js";
import PageState from "../shared/ui/PageState.jsx";
import "../CSS/OrderList.css";

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = useResponsivePageSize("orders");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setOrders(await getJson("/api/Order/getAllOrders"));
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter((order) => {
    const matchesSearch = order.orderId.toString().includes(searchTerm.trim());
    const matchesStatus = statusFilter === "" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleOrders = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="OrderList">
      <div className="header-row">
        <h2>All Orders</h2>
        <button className="add-button" onClick={() => setShowAdd(true)}>
          + Add Order
        </button>
      </div>

      <div className="filter-row">
        <input
          type="text"
          placeholder="Search by Order ID..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="search-input"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="status-select"
        >
          {ORDER_STATUS_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="order-grid">
        {loading && (
          <PageState
            title="Loading orders"
            description="We are fetching the latest orders."
          />
        )}

        {!loading && error && (
          <PageState
            variant="error"
            title="Could not load orders"
            description={error}
          />
        )}

        {!loading &&
          !error &&
          visibleOrders.map((order) => (
            <div
              key={order._id}
              className={`order-card ${getStatusColor(order)}`}
              onClick={() => setSelected(order)}
            >
              <h3>Order #{order.orderId}</h3>
              <p>Status: {order.status}</p>
              <p>Items: {order.items.length}</p>
            </div>
          ))}

        {!loading && !error && filtered.length === 0 && (
          <PageState
            title={searchTerm.trim() || statusFilter ? "No matching orders" : "No orders yet"}
            description={
              searchTerm.trim() || statusFilter
                ? "Try a different order ID or status filter."
                : "Add an order to start tracking production progress."
            }
            className="no-results"
          />
        )}
      </div>

      {!loading && !error && filtered.length > 0 && (
        <div className="pagination-row">
          <button
            type="button"
            className="page-button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="page-meta">
            <strong>{filtered.length}</strong> orders · Page {currentPage} of {totalPages}
          </div>
          <button
            type="button"
            className="page-button"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          refreshList={fetchOrders}
        />
      )}

      {showAdd && (
        <AddOrderModal
          onClose={() => setShowAdd(false)}
          refreshList={fetchOrders}
        />
      )}
    </div>
  );
};

export default OrderList;
