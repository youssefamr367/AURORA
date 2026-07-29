import { useEffect, useState } from "react";
import { createSupplier } from "../features/suppliers/api.js";
import {
  sanitizeSupplierPhone,
  validateSupplierForm,
} from "../features/suppliers/form.js";
import FeedbackMessage from "../shared/ui/FeedbackMessage.jsx";
import FormMessage from "../shared/ui/FormMessage.jsx";
import "../CSS/SupplierModal.css";

const AddSupplierModal = ({ onClose, refreshList }) => {
  const [form, setForm] = useState({ name: "", number: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [loading, onClose]);

  const handleBackdrop = (event) => {
    if (event.target === event.currentTarget && !loading) {
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

  const handleSubmit = async () => {
    if (loading) return;

    const nextErrors = validateSupplierForm(form);
    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await createSupplier({
        name: form.name.trim(),
        number: form.number,
      });
      await refreshList();
      onClose();
    } catch (err) {
      let errorMsg = err.message || "Failed to create supplier";
      if (
        errorMsg.toLowerCase().includes("duplicate") ||
        errorMsg.toLowerCase().includes("already exists")
      ) {
        errorMsg =
          "A supplier with this name already exists. Please use a different name.";
      }
      setSubmitError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="supplier-modal-backdrop" onMouseDown={handleBackdrop}>
      <div
        className="supplier-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-create-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="supplier-modal__header">
          <div>
            <h3 id="supplier-create-title" className="supplier-modal__title">
              New Supplier
            </h3>
            <p className="supplier-modal__subtitle">
              Add a supplier with a name and 11-digit phone number.
            </p>
          </div>
          <button
            type="button"
            className="supplier-modal__close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="supplier-modal__body">
          <div className="supplier-modal__field">
            <label htmlFor="supplier-name">Name</label>
            <input
              id="supplier-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Supplier name"
              disabled={loading}
              className={errors.name ? "is-invalid" : ""}
            />
            {errors.name ? (
              <div className="supplier-modal__error">{errors.name}</div>
            ) : (
              <FormMessage className="supplier-modal__hint">
                Use the supplier's display name as it appears in the app.
              </FormMessage>
            )}
          </div>

          <div className="supplier-modal__field">
            <label htmlFor="supplier-number">Phone Number</label>
            <input
              id="supplier-number"
              name="number"
              type="tel"
              inputMode="numeric"
              value={form.number}
              onChange={handleChange}
              maxLength={11}
              placeholder="e.g. 01234567890"
              disabled={loading}
              className={errors.number ? "is-invalid" : ""}
            />
            {errors.number ? (
              <div className="supplier-modal__error">{errors.number}</div>
            ) : (
              <FormMessage className="supplier-modal__hint">
                Digits only. The backend currently expects exactly 11 digits.
              </FormMessage>
            )}
          </div>

          {submitError && (
            <FeedbackMessage variant="error" className="supplier-modal__alert">
              <strong>Error:</strong> {submitError}
            </FeedbackMessage>
          )}
        </div>

        <div className="supplier-modal__footer">
          <button
            type="button"
            className="supplier-modal__button supplier-modal__button--primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Supplier"}
          </button>
          <button
            type="button"
            className="supplier-modal__button supplier-modal__button--ghost"
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

export default AddSupplierModal;
