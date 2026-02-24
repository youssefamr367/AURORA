import { useState } from "react";
import ItemDetailModal from "./ItemDetailModal.jsx";
import "../CSS/AddOrderModal.css"; // reuse the same aom-* CSS

const OrderDetailModal = ({ order, onClose, refreshList }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingSla, setSavingSla] = useState(false);
  const [error, setError] = useState("");

  const updateStatus = async (newStatus) => {
    if (loading) return;

    // Ask user for SLA dates for the target status
    const todayIso = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

    const greenUntil = window.prompt(
      `SLA for status "${newStatus}"\\nToday: ${todayIso}\\nEnter GREEN UNTIL date (yyyy-mm-dd) or leave empty for none:`,
      ""
    );
    if (greenUntil === null) return; // user cancelled

    const orangeUntil = window.prompt(
      `SLA for status "${newStatus}"\\nToday: ${todayIso}\\nEnter ORANGE UNTIL date (yyyy-mm-dd) or leave empty for none:`,
      ""
    );
    if (orangeUntil === null) return;

    const redFrom = window.prompt(
      `SLA for status "${newStatus}"\\nToday: ${todayIso}\\nEnter RED FROM date (yyyy-mm-dd) or leave empty for none (red after orange):`,
      ""
    );
    if (redFrom === null) return;

    const slaForStatus = {};
    if (greenUntil) slaForStatus.greenUntil = greenUntil;
    if (orangeUntil) slaForStatus.orangeUntil = orangeUntil;
    if (redFrom) slaForStatus.redFrom = redFrom;

    const payload = { status: newStatus };
    if (Object.keys(slaForStatus).length) {
      payload.statusSla = {
        ...(order.statusSla || {}),
        [newStatus]: slaForStatus,
      };
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/Order/updateByProductId/${order.orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        refreshList();
        onClose();
      } else {
        setError(data.message || data.error || "Failed to update order status");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async () => {
    if (!window.confirm("Delete this order? This action cannot be undone.")) return;
    if (deleting) return;
    
    setDeleting(true);
    setError("");
    
    try {
      const res = await fetch(`/api/Order/deleteByOrderId/${order.orderId}`, { 
        method: "DELETE" 
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        refreshList();
        onClose();
      } else {
        setError(data.message || data.error || "Failed to delete order");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Legacy SLA section removed – SLA is now configured per status change via prompts

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const actions = [];
  if (order.status === "New") {
    actions.push({ label: "Move to Manufacturing", next: "manufacturing" });
  } else if (order.status === "manufacturing") {
    actions.push({ label: "Back to New", next: "New" });
    actions.push({ label: "Move to Ready", next: "Done" });
  } else if (order.status === "Done") {
    actions.push({ label: "Back to Manufacturing", next: "manufacturing" });
    actions.push({ label: "Mark as Finished", next: "finished" });
  } else if (order.status === "finished") {
    actions.push({ label: "Back to Ready", next: "Done" });
  }

  return (
    <>
      <div className="aom-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="aom-modal" role="dialog" aria-modal="true" aria-labelledby="aom-title">
          {/* Header */}
          <div className="aom-header">
            <h3 id="aom-title">📦 Order #{order.orderId}</h3>
            <button type="button" className="aom-close" onClick={onClose}>×</button>
          </div>

          {/* Current Status */}
          <section className="aom-card">
            <div className="aom-field">
              <label>Current Status</label>
              <div>
                <span className={`aom-chip`}>{order.status}</span>
              </div>
            </div>
          </section>

          {/* Error for status/SLA actions */}
          {error && (
            <section className="aom-card">
              <div
                style={{
                  background: "#fee",
                  border: "1px solid #fcc",
                  padding: "12px",
                  borderRadius: "4px",
                }}
              >
                <strong style={{ color: "#c33" }}>Error:</strong> {error}
              </div>
            </section>
          )}

          {/* Status History */}
          {order.statusHistory?.length > 0 && (
            <section className="aom-card">
              <div className="aom-card-title">📊 Status History</div>
              <div className="aom-items">
                {order.statusHistory
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((entry, index) => (
                    <div key={index} className="aom-item">
                      <div className="aom-item-main">
                        <strong>{entry.status}</strong>
                        <div className="aom-muted">{formatDate(entry.date)}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Items */}
          <section className="aom-card">
            <div className="aom-card-title">📋 Items</div>
            <ul className="aom-items">
              {order.items.map((item, idx) => (
                <li key={idx} className="aom-item">
                  <div className="aom-item-main">
                    {item.product?.name} (#{item.product?.productId})
                  </div>
                  <button
                    type="button"
                    className="aom-link"
                    onClick={() => setSelectedItem(item)}
                  >
                    View
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Footer */}
          <div className="aom-footer">
            {actions.map((a) => (
              <button
                key={a.next}
                className="aom-primary"
                onClick={() => updateStatus(a.next)}
                disabled={loading || deleting || savingSla}
              >
                {loading ? "⏳ Updating..." : a.label}
              </button>
            ))}
            <button 
              type="button" 
              className="aom-btn" 
              onClick={deleteOrder}
              disabled={loading || deleting || savingSla}
            >
              {deleting ? "⏳ Deleting..." : "🗑️ Delete"}
            </button>
            <button 
              type="button" 
              className="aom-ghost" 
              onClick={onClose}
              disabled={loading || deleting || savingSla}
            >
              ✖️ Close
            </button>
          </div>
        </div>
      </div>

      {selectedItem && (
        <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
};

export default OrderDetailModal;
