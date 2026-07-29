import React, { useEffect, useState } from "react";
import { createProduct as createProductApi } from "../features/products/api.js";
import {
  createEmptyProductForm,
  createEmptyProductSelection,
  createProductPayload,
  findOptionName,
  loadProductFormLists,
  PRODUCT_LOOKUP_FIELDS,
  sanitizeProductId,
  validateProductForm,
} from "../features/products/form.js";
import FeedbackMessage from "../shared/ui/FeedbackMessage.jsx";
import FormMessage from "../shared/ui/FormMessage.jsx";
import "../CSS/AddOrderModal.css";

const AddProductModal = ({ onClose, refreshList }) => {
  const [form, setForm] = useState(() => createEmptyProductForm());
  const [lists, setLists] = useState({
    fabrics: [],
    eshra: [],
    paintings: [],
    marble: [],
    glass: [],
    suppliers: [],
  });
  const [selection, setSelection] = useState(() => createEmptyProductSelection());
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadProductFormLists()
      .then((data) => {
        if (!cancelled) {
          setLists(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load product form data.");
        }
      });

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

  const handleBackdrop = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onClose();
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "productId" ? sanitizeProductId(value) : value;

    setForm((current) => ({ ...current, [name]: nextValue }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setError("");
  };

  const handleSupplierChange = (event) => {
    setForm((current) => ({
      ...current,
      supplierId: event.target.value,
    }));
    setFieldErrors((current) => ({ ...current, supplierId: "" }));
    setError("");
  };

  const handleSelectChange = (field, value) => {
    setSelection((current) => ({ ...current, [field]: value }));
  };

  const addTag = (field) => {
    const id = selection[field];
    if (!id) return;

    setForm((current) => ({
      ...current,
      [field]: current[field].includes(id)
        ? current[field]
        : [...current[field], id],
    }));
    setSelection((current) => ({ ...current, [field]: "" }));
  };

  const removeTag = (field, id) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].filter((value) => value !== id),
    }));
  };

  const handleSubmit = async () => {
    if (loading) return;

    const errors = validateProductForm(form);
    setFieldErrors(errors);
    setError("");

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await createProductApi(createProductPayload(form));
      await refreshList();
      onClose();
    } catch (err) {
      let errorMsg =
        err.message || "Network error. Please check your connection and try again.";
      if (
        errorMsg.toLowerCase().includes("already exists") ||
        errorMsg.toLowerCase().includes("duplicate") ||
        err.status === 400
      ) {
        errorMsg = `Product ID ${form.productId} already exists. Please use a different product ID.`;
      }
      if (errorMsg.toLowerCase().includes("supplier")) {
        errorMsg = "Invalid supplier selected. Please select a valid supplier.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formValid =
    form.productId.trim() && form.name.trim() && form.supplierId.trim();

  return (
    <div className="aom-backdrop" onMouseDown={handleBackdrop}>
      <div
        className="aom-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aom-title"
      >
        <div className="aom-header">
          <h3 id="aom-title">New Product</h3>
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

        <section className="aom-card">
          <div className="aom-card-title">Product Details</div>
          <div className="aom-grid aom-2">
            <div className="aom-field">
              <label>
                Product ID <span className="req">*</span>
              </label>
              <input
                name="productId"
                value={form.productId}
                inputMode="numeric"
                placeholder="e.g. 101"
                onChange={handleChange}
              />
              {fieldErrors.productId ? (
                <FormMessage variant="error">{fieldErrors.productId}</FormMessage>
              ) : (
                <FormMessage>
                  Numeric only. This must stay unique across products.
                </FormMessage>
              )}
            </div>

            <div className="aom-field">
              <label>
                Supplier <span className="req">*</span>
              </label>
              <select value={form.supplierId} onChange={handleSupplierChange}>
                <option value="">Select supplier</option>
                {lists.suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {fieldErrors.supplierId ? (
                <FormMessage variant="error">{fieldErrors.supplierId}</FormMessage>
              ) : (
                <FormMessage>
                  Products are currently grouped by supplier in order entry.
                </FormMessage>
              )}
            </div>
          </div>

          <div className="aom-field">
            <label>
              Name <span className="req">*</span>
            </label>
            <input name="name" value={form.name} onChange={handleChange} />
            {fieldErrors.name ? (
              <FormMessage variant="error">{fieldErrors.name}</FormMessage>
            ) : (
              <FormMessage>
                Use the name exactly as it should appear in product and order lists.
              </FormMessage>
            )}
          </div>

          <div className="aom-field">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="aom-textarea"
            />
          </div>

          <div className="aom-field">
            <label>Image URL</label>
            <input name="images" value={form.images} onChange={handleChange} />
            <FormMessage>
              Optional. Existing product cards will use this value as-is.
            </FormMessage>
          </div>
        </section>

        <section className="aom-card">
          <div className="aom-card-title">Customizations</div>
          <div className="aom-grid aom-2">
            {PRODUCT_LOOKUP_FIELDS.map((field) => (
              <div key={field} className="aom-field">
                <label>{field[0].toUpperCase() + field.slice(1)}</label>
                <div className="aom-inline">
                  <select
                    value={selection[field]}
                    onChange={(event) =>
                      handleSelectChange(field, event.target.value)
                    }
                  >
                    <option value="">Select</option>
                    {lists[field].map((option) => (
                      <option key={option._id} value={option._id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="aom-btn"
                    onClick={() => addTag(field)}
                  >
                    Add
                  </button>
                </div>

                {!!form[field].length && (
                  <div className="aom-chips">
                    {form[field].map((id) => (
                      <span key={id} className="aom-chip">
                        {findOptionName(lists[field], id)}
                        <button
                          type="button"
                          className="aom-x"
                          onClick={() => removeTag(field, id)}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {error && (
          <FeedbackMessage variant="error">
            <strong>Error:</strong> {error}
          </FeedbackMessage>
        )}

        <div className="aom-footer">
          <button
            type="button"
            className="aom-primary"
            disabled={!formValid || loading}
            onClick={handleSubmit}
          >
            {loading ? "Creating..." : "Save Product"}
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

export default AddProductModal;
