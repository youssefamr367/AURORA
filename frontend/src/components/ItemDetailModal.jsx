import React, { useEffect } from "react";
import "../CSS/ItemDetailModal.css";

const ItemDetailModal = ({ item, onClose }) => {
  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Helper to render either strings or {name} objects
  const renderList = (arr) => {
    if (!arr || arr.length === 0) return "-";
    return arr.map((x) => (typeof x === "string" ? x : x.name)).join(", ");
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>Item Details</h3>

        <p>
          <strong>Product:</strong> {item.product?.name || "-"} (#
          {item.product?.productId || "-"})
        </p>

        <p>
          <strong>Quantity:</strong> {item.quantity || 1}
        </p>

        <p>
          <strong>Description:</strong>{" "}
          {item.description && item.description.trim() ? item.description : "—"}
        </p>

        <p>
          <strong>Fabrics:</strong> {renderList(item.fabrics)}
        </p>
        <p>
          <strong>Eshra:</strong> {renderList(item.eshra)}
        </p>
        <p>
          <strong>Paintings:</strong> {renderList(item.paintings)}
        </p>
        <p>
          <strong>Marble:</strong> {renderList(item.marble)}
        </p>
        <p>
          <strong>Glass:</strong> {renderList(item.glass)}
        </p>

        <p>
          <strong>Supplier:</strong> {item.supplier?.name || "-"}
        </p>

        <div className="modal-buttons">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
