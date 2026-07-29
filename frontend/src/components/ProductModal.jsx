import { useEffect, useState } from "react";
import {
  deleteProduct as deleteProductApi,
  updateProduct as updateProductApi,
} from "../features/products/api.js";
import {
  createEmptyProductSelection,
  createProductUpdatePayload,
  findOptionName,
  loadProductFormLists,
  mapProductToEditForm,
  PRODUCT_LOOKUP_FIELDS,
  validateProductForm,
} from "../features/products/form.js";
import FeedbackMessage from "../shared/ui/FeedbackMessage.jsx";
import FormMessage from "../shared/ui/FormMessage.jsx";
import InlineConfirm from "../shared/ui/InlineConfirm.jsx";
import "../CSS/AddOrderModal.css";

const ProductModal = ({ product, onClose, refreshList }) => {
  const [form, setForm] = useState(() => mapProductToEditForm(product));
  const [lists, setLists] = useState({
    fabrics: [],
    eshra: [],
    paintings: [],
    marble: [],
    glass: [],
    suppliers: [],
  });
  const [selection, setSelection] = useState(() => ({
    ...createEmptyProductSelection(),
    supplier: product.supplier?._id || "",
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadProductFormLists()
      .then((data) => setLists(data))
      .catch((err) =>
        setError(err.message || "Failed to load product reference data.")
      );

    setForm(mapProductToEditForm(product));
    setSelection((current) => ({
      ...current,
      ...createEmptyProductSelection(),
      supplier: product.supplier?._id || "",
    }));
    setFieldErrors({});
    setError("");
    setConfirmDelete(false);
  }, [product]);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === "Escape" && !loading && !deleting) {
        onClose();
      }
    };

    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [deleting, loading, onClose]);

  const handleBackdrop = (event) => {
    if (event.target === event.currentTarget && !loading && !deleting) {
      onClose();
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setError("");
  };

  const handleSupplierChange = (event) => {
    const supplierId = event.target.value;
    setSelection((current) => ({ ...current, supplier: supplierId }));
    setForm((current) => ({ ...current, supplierId }));
    setFieldErrors((current) => ({ ...current, supplierId: "" }));
    setError("");
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

  const handleSave = async () => {
    if (loading || deleting) return;

    const errors = validateProductForm(form, { requireProductId: false });
    setFieldErrors(errors);
    setError("");

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await updateProductApi(
        product.productId,
        createProductUpdatePayload(form)
      );
      await refreshList();
      onClose();
    } catch (err) {
      setError(
        err.message || "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleting || loading) return;

    setDeleting(true);
    setError("");

    try {
      await deleteProductApi(product.productId);
      await refreshList();
      onClose();
    } catch (err) {
      setError(
        err.message || "Network error. Please check your connection and try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const formValid = form.name.trim() && form.supplierId?.trim();

  return (
    <div className="aom-backdrop" onMouseDown={handleBackdrop}>
      <div
        className="aom-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aom-title"
      >
        <div className="aom-header">
          <h3 id="aom-title">Edit {product.name}</h3>
          <button
            type="button"
            className="aom-close"
            onClick={onClose}
            disabled={loading || deleting}
            aria-label="Close"
          >
            x
          </button>
        </div>

        <section className="aom-card">
          <div className="aom-card-title">Product Details</div>
          <div className="aom-grid aom-2">
            <div className="aom-field">
              <label>Product ID</label>
              <input value={form.productId} disabled />
              <FormMessage>
                Product ID is fixed here because existing orders may reference it.
              </FormMessage>
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
                  Changing supplier affects how this product appears during order entry.
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
            ) : null}
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
                      setSelection((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
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
            onClick={handleSave}
            disabled={!formValid || loading || deleting}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            className="aom-btn"
            onClick={() => {
              setConfirmDelete((current) => !current);
              setError("");
            }}
            disabled={loading || deleting}
          >
            {confirmDelete ? "Keep Product" : "Delete"}
          </button>
          <button
            type="button"
            className="aom-ghost"
            onClick={onClose}
            disabled={loading || deleting}
          >
            Cancel
          </button>
        </div>

        {confirmDelete && (
          <InlineConfirm
            title="Delete this product?"
            description="This action cannot be undone."
            confirmLabel={deleting ? "Deleting..." : "Confirm Delete"}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
            confirmDisabled={loading || deleting}
            cancelDisabled={loading || deleting}
          />
        )}
      </div>
    </div>
  );
};

export default ProductModal;
