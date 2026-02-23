import React, { useEffect, useMemo, useState } from "react";
import "../CSS/AddOrderModal.css";

const AddOrderModal = ({ onClose, refreshList }) => {
  // ----- State -----
  const [orderId, setOrderId] = useState("");
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const emptyItem = {
    productId: "",
    fabrics: [],
    eshra: [],
    paintings: [],
    marble: [],
    glass: [],
    supplierId: "",
    description: "",
    quantity: 1,
  };
  const [itemDraft, setItemDraft] = useState(emptyItem);

  const [selection, setSelection] = useState({
    fabrics: "",
    eshra: "",
    paintings: "",
    marble: "",
    glass: "",
  });

  const [items, setItems] = useState([]);

  const [statusSla, setStatusSla] = useState({
    New: { greenDays: "", orangeDays: "", redDays: "" },
    manufacturing: { greenDays: "", orangeDays: "", redDays: "" },
    Done: { greenDays: "", orangeDays: "", redDays: "" },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ----- Effects -----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pRes, sRes] = await Promise.all([
        fetch("/api/Product/getAllProduct"),
        fetch("/api/suppliers/all"),
      ]);
      const [pJson, sJson] = await Promise.all([pRes.json(), sRes.json()]);
      if (!cancelled) {
        setProducts(Array.isArray(pJson) ? pJson : []);
        setSuppliers(Array.isArray(sJson) ? sJson : []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ----- Derived -----
  // Filter products by selected supplier
  const filteredProducts = useMemo(() => {
    if (!itemDraft.supplierId) return [];
    return products.filter((p) => {
      // Handle populated supplier (object with _id)
      if (p.supplier?._id) {
        return p.supplier._id.toString() === itemDraft.supplierId.toString();
      }
      // Handle supplier as string ID
      if (typeof p.supplier === 'string') {
        return p.supplier === itemDraft.supplierId;
      }
      // Handle supplier as ObjectId (if not populated)
      if (p.supplier?.toString) {
        return p.supplier.toString() === itemDraft.supplierId.toString();
      }
      return false;
    });
  }, [products, itemDraft.supplierId]);

  const selProd = useMemo(
    () => filteredProducts.find((p) => p.productId?.toString() === itemDraft.productId),
    [filteredProducts, itemDraft.productId]
  );

  // ----- Helpers -----
  const normalizeSla = (raw) => {
    const out = {};
    for (const key of ["New", "manufacturing", "Done"]) {
      const { greenDays = "", orangeDays = "", redDays = "" } = raw[key] || {};
      const hasAny = greenDays !== "" || orangeDays !== "" || redDays !== "";
      if (hasAny) {
        out[key] = {};
        if (greenDays !== "") out[key].greenDays = Number(greenDays);
        if (orangeDays !== "") out[key].orangeDays = Number(orangeDays);
        if (redDays !== "") out[key].redDays = Number(redDays);
      }
    }
    return Object.keys(out).length ? out : undefined;
  };

  const resetItemDraft = () => {
    setItemDraft(emptyItem);
    setSelection({
      fabrics: "",
      eshra: "",
      paintings: "",
      marble: "",
      glass: "",
    });
  };

  // ----- Handlers -----
  const handleBackdrop = (e) => {
    // click backdrop only
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const handleSupplierChange = (e) => {
    const newSupplierId = e.target.value;
    setItemDraft({
      ...emptyItem,
      supplierId: newSupplierId,
      // Reset productId when supplier changes
      productId: "",
    });
    setSelection({
      fabrics: "",
      eshra: "",
      paintings: "",
      marble: "",
      glass: "",
    });
  };

  const handleProductChange = (e) => {
    setItemDraft({
      ...itemDraft,
      productId: e.target.value,
    });
    setSelection({
      fabrics: "",
      eshra: "",
      paintings: "",
      marble: "",
      glass: "",
    });
  };

  const handleItemMetaChange = (e) => {
    const { name, value } = e.target;

    if (name === "quantity") {
      const num = Math.max(1, Number(value) || 1);
      setItemDraft((d) => ({ ...d, quantity: num }));
    } else {
      setItemDraft((d) => ({ ...d, [name]: value }));
    }
  };

  const handleSelectionChange = (e) => {
    const { name, value } = e.target;
    setSelection((s) => ({ ...s, [name]: value }));
  };

  const addCustomization = (name) => {
    const val = selection[name];
    if (!val) return;
    setItemDraft((d) => ({
      ...d,
      [name]: d[name].includes(val) ? d[name] : [...d[name], val],
    }));
    setSelection((s) => ({ ...s, [name]: "" }));
  };

  const removeCustomization = (name, val) => {
    setItemDraft((d) => ({ ...d, [name]: d[name].filter((x) => x !== val) }));
  };

  // Check if at least one customization is selected
  const hasAtLeastOneCustomization = (draft) => {
    return (
      draft.fabrics.length > 0 ||
      draft.eshra.length > 0 ||
      draft.paintings.length > 0 ||
      draft.marble.length > 0 ||
      draft.glass.length > 0
    );
  };

  const addItem = () => {
    const { productId, supplierId } = itemDraft;
    if (!productId || !hasAtLeastOneCustomization(itemDraft) || !supplierId) return;
    setItems((i) => [...i, itemDraft]);
    resetItemDraft();
  };

  const removeItem = (index) => {
    setItems((arr) => arr.filter((_, i) => i !== index));
  };

  const formValid = orderId && items.length > 0;

  const handleSubmit = async () => {
    if (!formValid || loading) return;
    
    setLoading(true);
    setError("");
    
    try {
      const payload = {
        orderId: parseInt(orderId, 10),
        items: items.map((i) => ({
          productId: parseInt(i.productId, 10),
          fabrics: i.fabrics,
          eshra: i.eshra,
          paintings: i.paintings,
          marble: i.marble,
          glass: i.glass,
          supplierId: i.supplierId,
          description: i.description || "",
          quantity: Number(i.quantity) || 1,
        })),
        statusSla: normalizeSla(statusSla),
      };

      const res = await fetch("/api/Order/CreateOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        await refreshList();
        onClose();
      } else {
        // Improve error messages
        let errorMsg = data.message || data.error || "Failed to create order";
        
        // Check for duplicate order ID
        if (errorMsg.toLowerCase().includes("duplicate") || 
            errorMsg.toLowerCase().includes("already exists") ||
            res.status === 400) {
          errorMsg = `Order ID ${orderId} already exists. Please use a different order ID.`;
        }
        
        setError(errorMsg);
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ----- UI -----
  return (
    <div className="aom-backdrop" onMouseDown={handleBackdrop}>
      <div
        className="aom-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aom-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="aom-header">
          <h3 id="aom-title">New Order</h3>
          <button
            type="button"
            className="aom-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Order */}
        <section className="aom-card">
          <div className="aom-grid aom-2">
            <div className="aom-field">
              <label htmlFor="orderId">
                Order ID <span className="req">*</span>
              </label>
              <input
                id="orderId"
                inputMode="numeric"
                placeholder="e.g. 12045"
                value={orderId}
                onChange={(e) =>
                  setOrderId(e.target.value.replace(/[^\d]/g, ""))
                }
              />
              {!orderId && <div className="aom-hint">Required</div>}
            </div>

            <div className="aom-field">
              <label htmlFor="supplier">
                Supplier (for current item) <span className="req">*</span>
              </label>
              <select
                id="supplier"
                value={itemDraft.supplierId}
                onChange={handleSupplierChange}
              >
                <option value="">— Select supplier —</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {!itemDraft.supplierId && (
                <div className="aom-hint">Required for adding an item</div>
              )}
            </div>
          </div>
        </section>

        {/* Item Builder */}
        <section className="aom-card">
          <div className="aom-field">
            <label htmlFor="product">
              Product <span className="req">*</span>
            </label>
            <select
              id="product"
              value={itemDraft.productId}
              onChange={handleProductChange}
              disabled={!itemDraft.supplierId}
            >
              <option value="">
                {!itemDraft.supplierId 
                  ? "— Please select a supplier first —" 
                  : "— Select product —"}
              </option>
              {filteredProducts.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.name} (#{p.productId})
                </option>
              ))}
            </select>
            {!itemDraft.supplierId && (
              <div className="aom-hint">Please select a supplier first</div>
            )}
            {itemDraft.supplierId && filteredProducts.length === 0 && (
              <div className="aom-hint">No products available for this supplier</div>
            )}
          </div>

          {selProd && (
            <div className="aom-grid aom-2">
              {["fabrics", "eshra", "paintings", "marble", "glass"].map(
                (field) => (
                  <div key={field} className="aom-field">
                    <label>{field[0].toUpperCase() + field.slice(1)}</label>
                    <div className="aom-inline">
                      <select
                        name={field}
                        value={selection[field]}
                        onChange={handleSelectionChange}
                      >
                        <option value="">—</option>
                        {(selProd[field] || []).map((opt) => (
                          <option key={opt._id} value={opt._id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="aom-btn"
                        onClick={() => addCustomization(field)}
                      >
                        Add
                      </button>
                    </div>

                    {!!itemDraft[field]?.length && (
                      <div className="aom-chips">
                        {itemDraft[field].map((val) => {
                          const label =
                            selProd[field]?.find((o) => o._id === val)?.name ||
                            val;
                          return (
                            <span key={val} className="aom-chip">
                              {label}
                              <button
                                type="button"
                                className="aom-x"
                                aria-label={`Remove ${label}`}
                                onClick={() => removeCustomization(field, val)}
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* Per-item meta (description & quantity) */}
          <div className="aom-grid aom-2">
            <div className="aom-field">
              <label htmlFor="itemDescription">Item Description</label>
              <textarea
                id="itemDescription"
                name="description"
                placeholder="Optional notes about this item (e.g. special instructions)"
                value={itemDraft.description}
                onChange={handleItemMetaChange}
                rows={3}
              />
            </div>
            <div className="aom-field">
              <label htmlFor="itemQuantity">
                Quantity <span className="req">*</span>
              </label>
              <input
                id="itemQuantity"
                name="quantity"
                type="number"
                min="1"
                value={itemDraft.quantity}
                onChange={handleItemMetaChange}
              />
            </div>
          </div>

          <div className="aom-actions-left">
            <button
              type="button"
              className="aom-btn"
              disabled={
                !itemDraft.productId ||
                !itemDraft.supplierId ||
                !hasAtLeastOneCustomization(itemDraft)
              }
              onClick={addItem}
              title="Product, at least one customization (fabrics, eshra, paintings, marble, or glass), and a supplier are required."
            >
              + Add Item
            </button>
          </div>
        </section>

        {/* SLA */}
        <section className="aom-card">
          <div className="aom-card-title">Status SLA (days, optional)</div>
          <div className="aom-grid aom-3">
            {["New", "manufacturing", "Done"].map((st) => (
              <div key={st} className="aom-sla">
                <div className="aom-sla-title">{st}</div>
                <div className="aom-sla-grid">
                  <label>Green ≤</label>
                  <input
                    type="number"
                    min="0"
                    value={statusSla[st].greenDays}
                    onChange={(e) =>
                      setStatusSla((s) => ({
                        ...s,
                        [st]: { ...s[st], greenDays: e.target.value },
                      }))
                    }
                  />
                  <label>Orange ≤</label>
                  <input
                    type="number"
                    min="0"
                    value={statusSla[st].orangeDays}
                    onChange={(e) =>
                      setStatusSla((s) => ({
                        ...s,
                        [st]: { ...s[st], orangeDays: e.target.value },
                      }))
                    }
                  />
                  <label>Red ≤</label>
                  <input
                    type="number"
                    min="0"
                    value={statusSla[st].redDays}
                    onChange={(e) =>
                      setStatusSla((s) => ({
                        ...s,
                        [st]: { ...s[st], redDays: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Items */}
        <section className="aom-card">
          <div className="aom-card-title">Items</div>
          {items.length === 0 ? (
            <p className="aom-muted">No items added yet.</p>
          ) : (
            <ul className="aom-items">
              {items.map((it, idx) => {
                const prodName =
                  products.find((p) => p.productId?.toString() === it.productId)
                    ?.name || `#${it.productId}`;
                const supplierName =
                  suppliers.find((s) => s._id === it.supplierId)?.name ||
                  it.supplierId;

                return (
                  <li key={idx} className="aom-item">
                    <div className="aom-item-main">
                      <strong>{prodName}</strong>
                      <div className="aom-muted">Supplier: {supplierName}</div>
                      <div className="aom-muted">Qty: {it.quantity || 1}</div>
                      {it.description && (
                        <div className="aom-muted">Notes: {it.description}</div>
                      )}
                      {!!it.fabrics.length && (
                        <div className="aom-muted">
                          Fabrics: {it.fabrics.length}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="aom-link"
                      onClick={() => removeItem(idx)}
                      aria-label={`Remove item ${idx + 1}`}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Error Message */}
        {error && (
          <div className="aom-card" style={{ background: "#fee", border: "1px solid #fcc", padding: "12px", margin: "16px 0" }}>
            <strong style={{ color: "#c33" }}>Error:</strong> {error}
          </div>
        )}

        {/* Footer */}
        <div className="aom-footer">
          <button
            type="button"
            className="aom-primary"
            disabled={!formValid || loading}
            onClick={handleSubmit}
          >
            {loading ? "⏳ Creating..." : "Save Order"}
          </button>
          <button 
            type="button" 
            className="aom-ghost" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOrderModal;
