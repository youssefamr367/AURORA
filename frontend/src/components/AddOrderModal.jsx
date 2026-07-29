import { useEffect, useMemo, useState } from "react";
import { getJson, postJson } from "../shared/api/client.js";
import {
  createStatusSlaDraft,
  formatStatusDeadline,
  getStatusSlaValidation,
  normalizeStatusSla,
  ORDER_SLA_LEVELS,
} from "../features/orders/orderStatus.js";
import FeedbackMessage from "../shared/ui/FeedbackMessage.jsx";
import FormMessage from "../shared/ui/FormMessage.jsx";
import "../CSS/AddOrderModal.css";

const CUSTOMIZATION_FIELDS = [
  { key: "fabrics", label: "Fabrics" },
  { key: "eshra", label: "Eshra" },
  { key: "paintings", label: "Paintings" },
  { key: "marble", label: "Marble" },
  { key: "glass", label: "Glass" },
];

const ORDER_STEPS = [
  { key: "overview", label: "Order setup", caption: "ID and SLA" },
  { key: "items", label: "Items", caption: "Build" },
  { key: "review", label: "Review", caption: "Confirm" },
];

const EMPTY_ITEM = {
  supplierId: "",
  productId: "",
  quantity: 1,
  description: "",
  fabrics: [],
  eshra: [],
  paintings: [],
  marble: [],
  glass: [],
};

const EMPTY_SELECTION = {
  fabrics: "",
  eshra: "",
  paintings: "",
  marble: "",
  glass: "",
};

function cloneEmptyItem(supplierId = "") {
  return { ...EMPTY_ITEM, supplierId };
}

function resolveSupplierId(product) {
  if (!product?.supplier) return "";
  if (typeof product.supplier === "string") return product.supplier;
  return product.supplier._id || product.supplier.id || "";
}

function findOptionLabel(options, id) {
  return options?.find((option) => option._id === id)?.name || id;
}

function countSelections(item) {
  return CUSTOMIZATION_FIELDS.reduce(
    (total, field) => total + (item[field.key]?.length || 0),
    0
  );
}

const AddOrderModal = ({ onClose, refreshList }) => {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [step, setStep] = useState(0);
  const [orderId, setOrderId] = useState("");
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [itemDraft, setItemDraft] = useState(EMPTY_ITEM);
  const [selectionDraft, setSelectionDraft] = useState(EMPTY_SELECTION);
  const [statusSla, setStatusSla] = useState(() => createStatusSlaDraft());
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [itemError, setItemError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingData(true);
      setError("");

      try {
        const [productData, supplierData] = await Promise.all([
          getJson("/api/Product/getAllProduct"),
          getJson("/api/suppliers/all"),
        ]);

        if (cancelled) return;

        setProducts(Array.isArray(productData) ? productData : []);
        setSuppliers(Array.isArray(supplierData) ? supplierData : []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load products and suppliers.");
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [loading, onClose]);

  const filteredProducts = useMemo(() => {
    if (!itemDraft.supplierId) return [];

    return products.filter(
      (product) => resolveSupplierId(product)?.toString() === itemDraft.supplierId
    );
  }, [itemDraft.supplierId, products]);

  const selectedProduct = useMemo(
    () =>
      filteredProducts.find(
        (product) => String(product.productId) === String(itemDraft.productId)
      ) || null,
    [filteredProducts, itemDraft.productId]
  );

  const newStatusValidation = getStatusSlaValidation(statusSla.New, today);
  const basicsReady = orderId.trim() && newStatusValidation.valid;
  const itemsReady = items.length > 0;
  const canSubmit = basicsReady && itemsReady;
  const currentStepMeta = ORDER_STEPS[step];

  const resetItemDraft = (supplierId = "") => {
    setItemDraft(cloneEmptyItem(supplierId));
    setSelectionDraft(EMPTY_SELECTION);
    setItemError("");
  };

  const handleBackdrop = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onClose();
    }
  };

  const handleSupplierChange = (event) => {
    const supplierId = event.target.value;
    resetItemDraft(supplierId);
  };

  const handleProductChange = (event) => {
    const productId = event.target.value;
    setItemDraft((current) => ({
      ...cloneEmptyItem(current.supplierId),
      supplierId: current.supplierId,
      productId,
      quantity: current.quantity,
      description: current.description,
    }));
    setSelectionDraft(EMPTY_SELECTION);
    setItemError("");
  };

  const handleItemMetaChange = (event) => {
    const { name, value } = event.target;
    setItemError("");

    if (name === "quantity") {
      setItemDraft((current) => ({
        ...current,
        quantity: Math.max(1, Number(value) || 1),
      }));
      return;
    }

    setItemDraft((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSlaChange = (field, value) => {
    setStatusSla((current) => ({
      ...current,
      New: {
        ...current.New,
        [field]: value,
      },
    }));
  };

  const handleSelectionChange = (field, value) => {
    setSelectionDraft((current) => ({
      ...current,
      [field]: value,
    }));
    setItemError("");
  };

  const addCustomization = (field) => {
    const value = selectionDraft[field];
    if (!value) return;

    setItemDraft((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field]
        : [...current[field], value],
    }));
    setSelectionDraft((current) => ({
      ...current,
      [field]: "",
    }));
    setItemError("");
  };

  const removeCustomization = (field, value) => {
    setItemDraft((current) => ({
      ...current,
      [field]: current[field].filter((entry) => entry !== value),
    }));
  };

  const addItem = () => {
    if (!itemDraft.supplierId) {
      setItemError("Choose a supplier for this item.");
      return;
    }

    if (!itemDraft.productId) {
      setItemError("Choose a product for this item.");
      return;
    }

    if (countSelections(itemDraft) === 0) {
      setItemError("Add at least one customization before saving the item.");
      return;
    }

    setItems((current) => [...current, { ...itemDraft }]);
    resetItemDraft(itemDraft.supplierId);
  };

  const removeItem = (index) => {
    setItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const goNext = () => {
    if (step === 0 && !basicsReady) return;
    if (step === 1 && !itemsReady) return;
    setStep((current) => Math.min(current + 1, ORDER_STEPS.length - 1));
  };

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;

    setLoading(true);
    setError("");

    try {
      await postJson("/api/Order/CreateOrder", {
        orderId: Number(orderId),
        items: items.map((item) => ({
          productId: Number(item.productId),
          supplierId: item.supplierId,
          quantity: Number(item.quantity) || 1,
          description: item.description || "",
          fabrics: item.fabrics,
          eshra: item.eshra,
          paintings: item.paintings,
          marble: item.marble,
          glass: item.glass,
        })),
        statusSla: normalizeStatusSla({
          New: statusSla.New,
        }),
      });

      await refreshList();
      onClose();
    } catch (err) {
      let message =
        err.message || "Network error. Please check your connection and try again.";

      if (
        message.toLowerCase().includes("duplicate") ||
        message.toLowerCase().includes("already exists")
      ) {
        message = `Order ID ${orderId} already exists. Please choose another one.`;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderSlaFields = () => (
    <div className="aom-sla-panel">
      <div className="aom-section-head">
        <div>
          <div className="aom-card-title">New state SLA</div>
          <div className="aom-subtle">Choose the three checkpoints.</div>
        </div>
        <div className="aom-legend" aria-label="SLA color meaning">
          <span className="aom-legend-pill aom-legend-pill--green">Good</span>
          <span className="aom-legend-pill aom-legend-pill--orange">Warning</span>
          <span className="aom-legend-pill aom-legend-pill--red">Risk</span>
        </div>
      </div>
      <div className="aom-grid aom-3">
        {ORDER_SLA_LEVELS.map((level, index) => {
          const priorDate =
            index === 0
              ? today
              : statusSla.New[ORDER_SLA_LEVELS[index - 1].key] || today;

          return (
            <div key={level.key} className={`aom-field aom-sla-band aom-sla-band--${level.tone}`}>
              <label htmlFor={`new-${level.key}`}>
                {level.label} <span className="req">*</span>
              </label>
              <input
                id={`new-${level.key}`}
                type="date"
                min={priorDate}
                value={statusSla.New[level.key]}
                onChange={(event) => handleSlaChange(level.key, event.target.value)}
              />
            </div>
          );
        })}
      </div>
      {!newStatusValidation.valid && (
        <FormMessage>{newStatusValidation.message}</FormMessage>
      )}
    </div>
  );

  const renderCustomizationPicker = (field) => {
    const options = selectedProduct?.[field.key] || [];
    const selectedIds = itemDraft[field.key];

    return (
      <div key={field.key} className="aom-field aom-picker aom-card aom-card--nested">
        <div className="aom-picker-head">
          <label>{field.label}</label>
        </div>
        <div className="aom-inline">
          <select
            value={selectionDraft[field.key]}
            onChange={(event) => handleSelectionChange(field.key, event.target.value)}
            disabled={!selectedProduct || loading}
          >
            <option value="">
              {selectedProduct ? "Select" : "Choose a product first"}
            </option>
            {options.map((option) => (
              <option key={option._id} value={option._id}>
                {option.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="aom-btn"
            onClick={() => addCustomization(field.key)}
            disabled={!selectionDraft[field.key] || loading}
          >
            Add
          </button>
        </div>

        {selectedIds.length > 0 ? (
          <div className="aom-chips">
            {selectedIds.map((id) => (
              <span key={id} className="aom-chip">
                {findOptionLabel(options, id)}
                <button
                  type="button"
                  className="aom-x"
                  aria-label={`Remove ${findOptionLabel(options, id)}`}
                  onClick={() => removeCustomization(field.key, id)}
                  disabled={loading}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="aom-selection-empty">No selections yet</div>
        )}
      </div>
    );
  };

  const renderBasicsStep = () => (
    <section className="aom-card aom-shell">
      <div className="aom-section-head">
        <div>
          <div className="aom-card-title">Order setup</div>
          <div className="aom-subtle">Start with the order number and New-state targets.</div>
        </div>
      </div>
      <div className="aom-grid aom-2 aom-grid--top">
        <div className="aom-field">
          <label htmlFor="orderId">
            Order ID <span className="req">*</span>
          </label>
          <input
            id="orderId"
            inputMode="numeric"
            placeholder="e.g. 12045"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value.replace(/[^\d]/g, ""))}
          />
        </div>

        <div className="aom-kpi-strip">
          <div className="aom-kpi">
            <span className="aom-review-label">Items</span>
            <strong>{items.length}</strong>
          </div>
          <div className="aom-kpi">
            <span className="aom-review-label">Status</span>
            <strong>New</strong>
          </div>
        </div>
      </div>

      {renderSlaFields()}
    </section>
  );

  const renderItemsStep = () => (
    <div className="aom-stack">
      <section className="aom-card aom-shell">
        <div className="aom-section-head">
          <div>
            <div className="aom-card-title">Build item</div>
            <div className="aom-subtle">Supplier, product, quantity, then options.</div>
          </div>
        </div>
        <div className="aom-grid aom-3">
          <div className="aom-field">
            <label htmlFor="supplier">
              Supplier <span className="req">*</span>
            </label>
            <select
              id="supplier"
              value={itemDraft.supplierId}
              onChange={handleSupplierChange}
              disabled={loadingData || loading}
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="aom-field">
            <label htmlFor="product">
              Product <span className="req">*</span>
            </label>
            <select
              id="product"
              value={itemDraft.productId}
              onChange={handleProductChange}
              disabled={!itemDraft.supplierId || loadingData || loading}
            >
              <option value="">
                {itemDraft.supplierId ? "Select product" : "Select supplier first"}
              </option>
              {filteredProducts.map((product) => (
                <option key={product.productId} value={product.productId}>
                  {product.name} (#{product.productId})
                </option>
              ))}
            </select>
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
              disabled={loading}
            />
          </div>
        </div>

        <div className="aom-field">
          <label htmlFor="itemDescription">Item notes</label>
          <textarea
            id="itemDescription"
            name="description"
            className="aom-textarea"
            placeholder="Optional notes"
            value={itemDraft.description}
            onChange={handleItemMetaChange}
          />
        </div>

        {selectedProduct ? (
          <>
            <div className="aom-item-summary aom-item-summary--compact">
              <div>
                <span className="aom-review-label">Selected product</span>
                <strong>{selectedProduct.name}</strong>
              </div>
              <div>
                <span className="aom-review-label">Current selections</span>
                <strong>{countSelections(itemDraft)}</strong>
              </div>
            </div>
            <div className="aom-option-grid">
              {CUSTOMIZATION_FIELDS.map(renderCustomizationPicker)}
            </div>
          </>
        ) : (
          <div className="aom-empty-state">
            Pick a supplier and product to unlock the item options.
          </div>
        )}

        {!!itemDraft.supplierId && filteredProducts.length === 0 && (
          <div className="aom-selection-empty">
            No products are linked to this supplier yet.
          </div>
        )}

        {itemError && (
          <FeedbackMessage variant="error">
            <strong>Error:</strong> {itemError}
          </FeedbackMessage>
        )}

        <div className="aom-inline-actions">
          <button
            type="button"
            className="aom-primary aom-primary--hero"
            onClick={addItem}
            disabled={loading}
          >
            Add product to order
          </button>
        </div>
      </section>

      <section className="aom-card aom-shell">
        <div className="aom-section-head">
          <div className="aom-card-title">Items in order</div>
          <div className="aom-subtle">{items.length} added</div>
        </div>
        {itemsReady ? (
          <ul className="aom-items">
            {items.map((item, index) => {
              const product = products.find(
                (entry) => String(entry.productId) === String(item.productId)
              );
              const supplier = suppliers.find((entry) => entry._id === item.supplierId);

              return (
                <li key={`${item.productId}-${index}`} className="aom-item">
                  <div className="aom-item-main">
                    <strong>
                      {product?.name || `Product #${item.productId}`} x {item.quantity}
                    </strong>
                    <div className="aom-muted">Supplier: {supplier?.name || item.supplierId}</div>
                    <div className="aom-muted">
                      Selections: {countSelections(item)}
                    </div>
                    {item.description && (
                      <div className="aom-muted">Notes: {item.description}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="aom-link"
                    onClick={() => removeItem(index)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="aom-empty-state">
            No items yet.
          </div>
        )}

        <div className="aom-step-actions">
          <button
            type="button"
            className="aom-link aom-link--muted"
            onClick={() => setStep(0)}
            disabled={loading}
          >
            Back to setup
          </button>
          <button
            type="button"
            className="aom-primary"
            onClick={() => setStep(2)}
            disabled={loading || !itemsReady}
          >
            Review order
          </button>
        </div>
      </section>
    </div>
  );

  const renderReviewStep = () => (
    <section className="aom-card aom-shell">
      <div className="aom-section-head">
        <div className="aom-card-title">Review</div>
        <div className="aom-subtle">Final check before creating the order.</div>
      </div>
      <div className="aom-review-grid">
        <div className="aom-review-block">
          <span className="aom-review-label">Order ID</span>
          <strong>{orderId || "Not set"}</strong>
        </div>
        <div className="aom-review-block">
          <span className="aom-review-label">New-state SLA</span>
          <strong>{formatStatusDeadline(statusSla.New)}</strong>
        </div>
        <div className="aom-review-block">
          <span className="aom-review-label">Items</span>
          <strong>{items.length}</strong>
        </div>
      </div>

      <div className="aom-mini-list">
        {items.map((item, index) => {
          const product = products.find(
            (entry) => String(entry.productId) === String(item.productId)
          );
          const supplier = suppliers.find((entry) => entry._id === item.supplierId);

          return (
            <div key={`${item.productId}-${index}`} className="aom-review-block">
              <span className="aom-review-label">Item {index + 1}</span>
              <strong>{product?.name || `Product #${item.productId}`}</strong>
              <span className="aom-muted">Supplier: {supplier?.name || item.supplierId}</span>
              <span className="aom-muted">Quantity: {item.quantity}</span>
              <span className="aom-muted">Selections: {countSelections(item)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="aom-backdrop" onMouseDown={handleBackdrop}>
      <div
        className="aom-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aom-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="aom-header">
          <div>
            <h3 id="aom-title">Create order</h3>
            <div className="aom-header-subtitle">Step {step + 1} of {ORDER_STEPS.length} · {currentStepMeta.label}</div>
          </div>
          <button
            type="button"
            className="aom-close"
            onClick={onClose}
            aria-label="Close"
            disabled={loading}
          >
            x
          </button>
        </div>

        <div className="aom-steps" aria-label="Order creation steps">
          {ORDER_STEPS.map((item, index) => (
            <div
              key={item.key}
              className={`aom-step${
                index === step ? " active" : index < step ? " complete" : ""
              }`}
            >
              <span className="aom-step-index">{index + 1}</span>
              <div className="aom-step-copy">
                <span className="aom-step-label">{item.label}</span>
                <span className="aom-step-caption">{item.caption}</span>
              </div>
            </div>
          ))}
        </div>

        {loadingData && (
          <FeedbackMessage variant="info">
            Loading the order builder data...
          </FeedbackMessage>
        )}

        {error && (
          <FeedbackMessage variant="error">
            <strong>Error:</strong> {error}
          </FeedbackMessage>
        )}

        {step === 0 && renderBasicsStep()}
        {step === 1 && renderItemsStep()}
        {step === 2 && renderReviewStep()}

        <div className="aom-footer">
          {step > 0 && step !== 1 && (
            <button
              type="button"
              className="aom-ghost"
              onClick={() => setStep((current) => current - 1)}
              disabled={loading}
            >
              Back
            </button>
          )}

          {step < ORDER_STEPS.length - 1 && step !== 1 ? (
            <button
              type="button"
              className="aom-primary"
              onClick={goNext}
              disabled={
                loading ||
                loadingData ||
                (step === 0 && !basicsReady) ||
                (step === 1 && !itemsReady)
              }
            >
              Continue
            </button>
          ) : step === ORDER_STEPS.length - 1 ? (
            <button
              type="button"
              className="aom-primary"
              onClick={handleSubmit}
              disabled={loading || loadingData || !canSubmit}
            >
              {loading ? "Creating..." : "Create order"}
            </button>
          ) : null}

          {step !== 1 && (
            <button type="button" className="aom-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddOrderModal;
