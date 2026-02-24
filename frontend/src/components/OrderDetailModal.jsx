import { useState } from "react";
import ItemDetailModal from "./ItemDetailModal.jsx";
import "../CSS/AddOrderModal.css"; // reuse the same aom-* CSS

const OrderDetailModal = ({ order, onClose, refreshList }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [slaModalOpen, setSlaModalOpen] = useState(false);
  const [slaTargetStatus, setSlaTargetStatus] = useState(null);
  const [slaMode, setSlaMode] = useState("status"); // "status" | "edit"
  const [slaEnabled, setSlaEnabled] = useState(true);
  const [slaError, setSlaError] = useState("");
  const [slaDraft, setSlaDraft] = useState({
    greenUntil: "",
    orangeUntil: "",
    redFrom: "",
  });

  const validateSlaOrder = (draft) => {
    const toDay = (s) => {
      const d = new Date(s);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (draft.greenUntil) {
      const green = toDay(draft.greenUntil);
      if (green <= today) {
        setSlaError("Green date must be after today.");
        return false;
      }
    }

    if (draft.greenUntil && draft.orangeUntil) {
      const green = toDay(draft.greenUntil);
      const orange = toDay(draft.orangeUntil);
      if (orange <= green) {
        setSlaError("Orange date must be after Green date.");
        return false;
      }
    }

    if (draft.orangeUntil && draft.redFrom) {
      const orange = toDay(draft.orangeUntil);
      const red = toDay(draft.redFrom);
      if (red <= orange) {
        setSlaError("Red date must be after Orange date.");
        return false;
      }
    }

    return true;
  };

  const applyStatusUpdate = async (newStatus, nextSlaForStatus) => {
    if (loading) return;

    const payload = { status: newStatus };
    if (nextSlaForStatus && Object.keys(nextSlaForStatus).length) {
      payload.statusSla = {
        ...(order.statusSla || {}),
        [newStatus]: nextSlaForStatus,
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

  const openSlaModalForStatus = (newStatus) => {
    const existing = order.statusSla?.[newStatus] || {};
    const toInput = (d) =>
      d ? new Date(d).toISOString().slice(0, 10) : "";

    setSlaTargetStatus(newStatus);
    setSlaMode("status");
    setSlaEnabled(
      !!(existing.greenUntil || existing.orangeUntil || existing.redFrom)
    );
    setSlaError("");
    setSlaDraft({
      greenUntil: toInput(existing.greenUntil),
      orangeUntil: toInput(existing.orangeUntil),
      redFrom: toInput(existing.redFrom),
    });
    setSlaModalOpen(true);
  };

  const openSlaModalForEdit = (status) => {
    const existing = order.statusSla?.[status] || {};
    const toInput = (d) =>
      d ? new Date(d).toISOString().slice(0, 10) : "";

    setSlaTargetStatus(status);
    setSlaMode("edit");
    setSlaEnabled(
      !!(existing.greenUntil || existing.orangeUntil || existing.redFrom)
    );
    setSlaError("");
    setSlaDraft({
      greenUntil: toInput(existing.greenUntil),
      orangeUntil: toInput(existing.orangeUntil),
      redFrom: toInput(existing.redFrom),
    });
    setSlaModalOpen(true);
  };

  const applySlaOnlyUpdate = async (status, nextSlaForStatus) => {
    if (loading) return;

    const payload = {};
    if (nextSlaForStatus && Object.keys(nextSlaForStatus).length) {
      payload.statusSla = {
        ...(order.statusSla || {}),
        [status]: nextSlaForStatus,
      };
    } else {
      // If SLA disabled, remove SLA entry for this status
      const current = { ...(order.statusSla || {}) };
      delete current[status];
      payload.statusSla = Object.keys(current).length ? current : undefined;
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
        setError(data.message || data.error || "Failed to update SLA");
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

  // Legacy SLA section removed – SLA is now configured per status change via a dedicated modal

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
            <div className="aom-actions-left">
              <button
                type="button"
                className="aom-btn"
                onClick={() => openSlaModalForEdit(order.status)}
                disabled={loading || deleting}
              >
                Edit SLA for this status
              </button>
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
                onClick={() => openSlaModalForStatus(a.next)}
                disabled={loading || deleting}
              >
                {loading ? "⏳ Updating..." : a.label}
              </button>
            ))}
            <button 
              type="button" 
              className="aom-btn" 
              onClick={deleteOrder}
              disabled={loading || deleting}
            >
              {deleting ? "⏳ Deleting..." : "🗑️ Delete"}
            </button>
            <button 
              type="button" 
              className="aom-ghost" 
              onClick={onClose}
              disabled={loading || deleting}
            >
              ✖️ Close
            </button>
          </div>
        </div>
      </div>

      {selectedItem && (
        <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* SLA Modal */}
      {slaModalOpen && (
        <div className="aom-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSlaModalOpen(false)}>
          <div
            className="aom-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sla-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="aom-header">
              <h3 id="sla-title">SLA for status: {slaTargetStatus}</h3>
              <button
                type="button"
                className="aom-close"
                onClick={() => setSlaModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <section className="aom-card">
              <div className="aom-field">
                <label>Today</label>
                <div className="aom-muted">
                  {new Date().toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>

              <div className="aom-field">
                <label>
                  <input
                    type="checkbox"
                    checked={slaEnabled}
                    onChange={(e) => setSlaEnabled(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Enable SLA for this status
                </label>
              </div>

              {slaEnabled && (
                <div className="aom-grid aom-3">
                  <div className="aom-field">
                    <label>Green until</label>
                    <input
                      type="date"
                      value={slaDraft.greenUntil}
                      onChange={(e) =>
                        setSlaDraft((s) => ({ ...s, greenUntil: e.target.value }))
                      }
                    />
                  </div>
                  <div className="aom-field">
                    <label>Orange until</label>
                    <input
                      type="date"
                      value={slaDraft.orangeUntil}
                      onChange={(e) =>
                        setSlaDraft((s) => ({ ...s, orangeUntil: e.target.value }))
                      }
                    />
                  </div>
                  <div className="aom-field">
                    <label>Red from</label>
                    <input
                      type="date"
                      value={slaDraft.redFrom}
                      onChange={(e) =>
                        setSlaDraft((s) => ({ ...s, redFrom: e.target.value }))
                      }
                    />
                  </div>
                </div>
              )}

              {slaError && (
                <div className="aom-hint" style={{ color: "#dc2626", marginTop: 8 }}>
                  {slaError}
                </div>
              )}
            </section>

            <div className="aom-footer">
              <button
                type="button"
                className="aom-primary"
                onClick={() => {
                  if (slaEnabled && !validateSlaOrder(slaDraft)) {
                    return;
                  }

                  const nextSla =
                    slaEnabled
                      ? Object.fromEntries(
                          ["greenUntil", "orangeUntil", "redFrom"]
                            .map((k) => [k, slaDraft[k]])
                            .filter(([, v]) => v)
                        )
                      : null;

                  setSlaModalOpen(false);
                  if (slaMode === "status") {
                    applyStatusUpdate(slaTargetStatus, nextSla || undefined);
                  } else {
                    applySlaOnlyUpdate(slaTargetStatus, nextSla || undefined);
                  }
                }}
                disabled={loading}
              >
                Save
              </button>
              <button
                type="button"
                className="aom-ghost"
                onClick={() => {
                  setSlaModalOpen(false);
                  if (slaMode === "status") {
                    // Change status without modifying SLA for this status
                    applyStatusUpdate(slaTargetStatus, null);
                  }
                }}
                disabled={loading}
              >
                {slaMode === "status" ? "Skip SLA" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetailModal;
