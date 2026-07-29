import { useEffect, useState } from "react";
import {
  deleteSupplier,
  updateSupplier,
} from "../features/suppliers/api.js";
import {
  sanitizeSupplierPhone,
  validateSupplierForm,
} from "../features/suppliers/form.js";
import FeedbackMessage from "../shared/ui/FeedbackMessage.jsx";
import FormMessage from "../shared/ui/FormMessage.jsx";
import InlineConfirm from "../shared/ui/InlineConfirm.jsx";
import "../CSS/SupplierModal.css";

const SupplierModal = ({ supplier, onClose, refreshList }) => {
  const [form, setForm] = useState({ name: "", number: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setForm({
      name: supplier.name,
      number: supplier.number?.toString() || "",
    });
    setErrors({});
    setSubmitError("");
    setConfirmDelete(false);
  }, [supplier]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !loading && !deleting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [deleting, loading, onClose]);

  const handleBackdrop = (event) => {
    if (event.target === event.currentTarget && !loading && !deleting) {
      onClose();
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "number" ? sanitizeSupplierPhone(value) : value;

    setForm((current) => ({ ...current, [name]: nextValue }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitError("");
  };

  const handleSave = async () => {
    if (loading || deleting) return;

    const nextErrors = validateSupplierForm(form);
    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await updateSupplier(supplier._id, {
        name: form.name.trim(),
        number: form.number,
      });
      await refreshList();
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Failed to update supplier");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleting || loading) return;

    setDeleting(true);
    setSubmitError("");

    try {
      await deleteSupplier(supplier._id);
      await refreshList();
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Could not delete supplier");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="supplier-modal-backdrop" onMouseDown={handleBackdrop}>
      <div
        className="supplier-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-edit-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="supplier-modal__header">
          <div>
            <h3 id="supplier-edit-title" className="supplier-modal__title">
              Edit Supplier
            </h3>
            <p className="supplier-modal__subtitle">
              Update supplier details or remove this supplier.
            </p>
          </div>
          <button
            type="button"
            className="supplier-modal__close"
            onClick={onClose}
            disabled={loading || deleting}
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="supplier-modal__body">
          <div className="supplier-modal__summary">
            <span className="supplier-modal__summary-label">Current supplier</span>
            <strong>{supplier.name}</strong>
          </div>

          <div className="supplier-modal__field">
            <label htmlFor="supplier-edit-name">Name</label>
            <input
              id="supplier-edit-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={loading || deleting}
              className={errors.name ? "is-invalid" : ""}
            />
            {errors.name ? (
              <div className="supplier-modal__error">{errors.name}</div>
            ) : (
              <FormMessage className="supplier-modal__hint">
                Keep naming consistent with how suppliers appear in product forms.
              </FormMessage>
            )}
          </div>

          <div className="supplier-modal__field">
            <label htmlFor="supplier-edit-number">Phone Number</label>
            <input
              id="supplier-edit-number"
              name="number"
              type="tel"
              inputMode="numeric"
              value={form.number}
              onChange={handleChange}
              maxLength={11}
              placeholder="e.g. 01234567890"
              disabled={loading || deleting}
              className={errors.number ? "is-invalid" : ""}
            />
            {errors.number ? (
              <div className="supplier-modal__error">{errors.number}</div>
            ) : (
              <FormMessage className="supplier-modal__hint">
                Digits only. Exactly 11 digits are required by the backend.
              </FormMessage>
            )}
          </div>

          {submitError && (
            <FeedbackMessage variant="error" className="supplier-modal__alert">
              <strong>Error:</strong> {submitError}
            </FeedbackMessage>
          )}

          {confirmDelete && (
            <InlineConfirm
              title="Delete this supplier?"
              description="This action cannot be undone."
              confirmLabel={deleting ? "Deleting..." : "Confirm Delete"}
              onConfirm={handleDelete}
              onCancel={() => setConfirmDelete(false)}
              confirmDisabled={loading || deleting}
              cancelDisabled={loading || deleting}
            />
          )}
        </div>

        <div className="supplier-modal__footer">
          <button
            type="button"
            className="supplier-modal__button supplier-modal__button--primary"
            onClick={handleSave}
            disabled={loading || deleting}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            className="supplier-modal__button supplier-modal__button--danger"
            onClick={() => {
              setConfirmDelete((current) => !current);
              setSubmitError("");
            }}
            disabled={loading || deleting}
          >
            {confirmDelete ? "Keep Supplier" : "Delete Supplier"}
          </button>
          <button
            type="button"
            className="supplier-modal__button supplier-modal__button--ghost"
            onClick={onClose}
            disabled={loading || deleting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierModal;
