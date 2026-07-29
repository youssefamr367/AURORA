import { useCallback, useEffect, useMemo, useState } from "react";
import ItemDetailModal from "./ItemDetailModal.jsx";
import { deleteJson, putJson } from "../shared/api/client.js";
import {
  createStatusSlaDraft,
  formatStatusDeadline,
  getOrderStatusActions,
  getStatusDeadline,
  getStatusSlaValidation,
  normalizeStatusSla,
  ORDER_SLA_EDIT_STATUSES,
  ORDER_SLA_LEVELS,
} from "../features/orders/orderStatus.js";
import FeedbackMessage from "../shared/ui/FeedbackMessage.jsx";
import InlineConfirm from "../shared/ui/InlineConfirm.jsx";
import FormMessage from "../shared/ui/FormMessage.jsx";
import "../CSS/AddOrderModal.css";

const OrderDetailModal = ({ order, onClose, refreshList }) => {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingSla, setSavingSla] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [slaDraft, setSlaDraft] = useState(() => createStatusSlaDraft(order.statusSla));
  const [pendingAction, setPendingAction] = useState(null);
  const [transitionStep, setTransitionStep] = useState(0);

  const isBusy = loading || deleting || savingSla;
  const actions = getOrderStatusActions(order.status);
  const currentStatusSla = useMemo(() => getStatusDeadline(order), [order]);
  const currentStatusValidation = getStatusSlaValidation(slaDraft[order.status], today);
  const pendingStatusValidation = pendingAction
    ? getStatusSlaValidation(slaDraft[pendingAction.next], today)
    : { valid: true, message: "" };

  useEffect(() => {
    setSlaDraft(createStatusSlaDraft(order.statusSla));
    setPendingAction(null);
    setTransitionStep(0);
    setConfirmDelete(false);
    setError("");
    setNotice("");
  }, [order]);

  const attemptClose = useCallback(() => {
    if (!isBusy) onClose();
  }, [isBusy, onClose]);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === "Escape") {
        attemptClose();
      }
    };

    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [attemptClose]);

  const updateDraftStatus = (status, field, value) => {
    setSlaDraft((current) => ({
      ...current,
      [status]: {
        ...current[status],
        [field]: value,
      },
    }));
  };

  const cancelTransition = () => {
    if (isBusy) return;
    setPendingAction(null);
    setTransitionStep(0);
    setError("");
    setNotice("");
  };

  const startTransition = (action) => {
    setError("");
    setNotice("");
    setPendingAction(action);
    setTransitionStep(1);
  };

  const saveCurrentSla = async () => {
    if (savingSla || !ORDER_SLA_EDIT_STATUSES.includes(order.status)) return;
    if (!currentStatusValidation.valid) {
      setError(currentStatusValidation.message);
      return;
    }

    setSavingSla(true);
    setError("");
    setNotice("");

    try {
      await putJson(`/api/Order/updateByProductId/${order.orderId}`, {
        statusSla: normalizeStatusSla({
          [order.status]: slaDraft[order.status],
        }),
      });
      await refreshList();
      setNotice("Current status SLA saved.");
    } catch (err) {
      setError(err.message || "Failed to save the current status SLA.");
    } finally {
      setSavingSla(false);
    }
  };

  const updateStatus = async (action) => {
    if (loading) return;
    if (action.needsSla && !pendingStatusValidation.valid) {
      setError(pendingStatusValidation.message);
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const payload = { status: action.next };

      if (action.needsSla) {
        payload.statusSla = normalizeStatusSla({
          [action.next]: slaDraft[action.next],
        });
      }

      await putJson(`/api/Order/updateByProductId/${order.orderId}`, payload);
      await refreshList();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update the order status.");
    } finally {
      setLoading(false);
      setPendingAction(null);
      setTransitionStep(0);
    }
  };

  const deleteOrder = async () => {
    if (deleting) return;

    setDeleting(true);
    setError("");
    setNotice("");

    try {
      await deleteJson(`/api/Order/deleteByOrderId/${order.orderId}`);
      await refreshList();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to delete the order.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDateTime = (value) =>
    new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderSlaEditor = (status, title, helperMessage) => (
    <section className="aom-card aom-shell">
      <div className="aom-section-head">
        <div>
          <div className="aom-card-title">{title}</div>
          <div className="aom-subtle">{helperMessage}</div>
        </div>
      </div>
      <div className="aom-grid aom-3">
        {ORDER_SLA_LEVELS.map((level, index) => {
          const priorValue =
            index === 0
              ? today
              : slaDraft[status][ORDER_SLA_LEVELS[index - 1].key] || today;

          return (
            <div key={`${status}-${level.key}`} className={`aom-field aom-sla-band aom-sla-band--${level.tone}`}>
              <label htmlFor={`${status}-${level.key}`}>
                {level.label} <span className="req">*</span>
              </label>
              <input
                id={`${status}-${level.key}`}
                type="date"
                min={priorValue}
                value={slaDraft[status][level.key]}
                onChange={(event) => updateDraftStatus(status, level.key, event.target.value)}
                disabled={isBusy}
              />
            </div>
          );
        })}
      </div>
      {!getStatusSlaValidation(slaDraft[status], today).valid && (
        <FormMessage>{getStatusSlaValidation(slaDraft[status], today).message}</FormMessage>
      )}
    </section>
  );

  const getTransitionSteps = () => {
    if (!pendingAction) return [];

    const steps = [
      { key: "move", label: "Move" },
      ...(pendingAction.needsSla ? [{ key: "sla", label: "SLA" }] : []),
      { key: "confirm", label: "Confirm" },
    ];

    return steps;
  };

  const transitionSteps = getTransitionSteps();
  const transitionIndex = Math.max(0, transitionStep - 1);
  const canAdvanceTransition =
    pendingAction &&
    (transitionStep === 1
      ? true
      : transitionStep === 2 && pendingAction.needsSla
        ? pendingStatusValidation.valid
        : true);

  const handleTransitionNext = () => {
    if (!pendingAction) return;

    if (pendingAction.needsSla) {
      if (transitionStep === 1) {
        setTransitionStep(2);
        return;
      }
      if (transitionStep === 2) {
        if (!pendingStatusValidation.valid) {
          setError(pendingStatusValidation.message);
          return;
        }
        setTransitionStep(3);
      }
      return;
    }

    if (transitionStep === 1) {
      setTransitionStep(2);
    }
  };

  const handleTransitionBack = () => {
    if (!pendingAction) return;
    if (transitionStep <= 1) {
      cancelTransition();
      return;
    }
    setTransitionStep((current) => current - 1);
  };

  const renderTransitionFlow = () => {
    if (!pendingAction) return null;

    const isMoveStep = transitionStep === 1;
    const isSlaStep = pendingAction.needsSla && transitionStep === 2;
    const isConfirmStep =
      (!pendingAction.needsSla && transitionStep === 2) ||
      (pendingAction.needsSla && transitionStep === 3);

    return (
      <>
        <section className="aom-card aom-shell">
          <div className="aom-section-head">
            <div>
              <div className="aom-card-title">{pendingAction.label}</div>
              <div className="aom-subtle">Move this order in guided steps.</div>
            </div>
          </div>

          <div className="aom-transition-steps">
            {transitionSteps.map((step, index) => (
              <div
                key={step.key}
                className={`aom-transition-step${
                  index === transitionIndex
                    ? " active"
                    : index < transitionIndex
                      ? " complete"
                      : ""
                }`}
              >
                <span>{index + 1}</span>
                <strong>{step.label}</strong>
              </div>
            ))}
          </div>
        </section>

        {isMoveStep && (
          <section className="aom-card aom-shell">
            <div className="aom-card-title">Review the move</div>
            <div className="aom-review-grid">
              <div className="aom-review-block">
                <span className="aom-review-label">Current status</span>
                <strong>{order.status}</strong>
              </div>
              <div className="aom-review-block">
                <span className="aom-review-label">Next status</span>
                <strong>{pendingAction.next}</strong>
              </div>
              <div className="aom-review-block">
                <span className="aom-review-label">Order</span>
                <strong>#{order.orderId}</strong>
              </div>
            </div>
          </section>
        )}

        {isSlaStep &&
          renderSlaEditor(
            pendingAction.next,
            `${pendingAction.next} SLA`,
            `Set the SLA dates that should apply once the order enters ${pendingAction.next}.`
          )}

        {isConfirmStep && (
          <section className="aom-card aom-shell">
            <div className="aom-card-title">Confirm move</div>
            <div className="aom-review-grid">
              <div className="aom-review-block">
                <span className="aom-review-label">From</span>
                <strong>{order.status}</strong>
              </div>
              <div className="aom-review-block">
                <span className="aom-review-label">To</span>
                <strong>{pendingAction.next}</strong>
              </div>
              {pendingAction.needsSla && (
                <div className="aom-review-block">
                  <span className="aom-review-label">Target SLA</span>
                  <strong>{formatStatusDeadline(slaDraft[pendingAction.next])}</strong>
                </div>
              )}
            </div>
          </section>
        )}

        {error && (
          <FeedbackMessage variant="error">
            <strong>Error:</strong> {error}
          </FeedbackMessage>
        )}

        <div className="aom-footer">
          <button
            type="button"
            className="aom-ghost"
            onClick={handleTransitionBack}
            disabled={isBusy}
          >
            {transitionStep === 1 ? "Cancel" : "Back"}
          </button>

          {!isConfirmStep ? (
            <button
              type="button"
              className="aom-primary"
              onClick={handleTransitionNext}
              disabled={isBusy || !canAdvanceTransition}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="aom-primary"
              onClick={() => updateStatus(pendingAction)}
              disabled={isBusy || (pendingAction.needsSla && !pendingStatusValidation.valid)}
            >
              {loading ? "Updating..." : "Confirm move"}
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <div
        className="aom-backdrop"
        onMouseDown={(event) =>
          event.target === event.currentTarget && attemptClose()
        }
      >
        <div
          className="aom-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="aom-title"
        >
          <div className="aom-header">
            <div>
              <h3 id="aom-title">Order #{order.orderId}</h3>
              <div className="aom-header-subtitle">Status, SLA, and items</div>
            </div>
            <button
              type="button"
              className="aom-close"
              onClick={attemptClose}
              aria-label="Close"
              disabled={isBusy}
            >
              x
            </button>
          </div>

          {pendingAction ? (
            renderTransitionFlow()
          ) : (
            <>
              <section className="aom-card aom-shell">
                <div className="aom-grid aom-2">
                  <div className="aom-kpi">
                    <span className="aom-review-label">Current status</span>
                    <strong>{order.status}</strong>
                    <span className="aom-muted">
                      Started {formatDateTime(order.updatedAt || order.createdAt)}
                    </span>
                  </div>
                  <div className="aom-kpi">
                    <span className="aom-review-label">Current SLA window</span>
                    <strong>{formatStatusDeadline(currentStatusSla)}</strong>
                  </div>
                </div>
              </section>

              {ORDER_SLA_EDIT_STATUSES.includes(order.status) &&
                renderSlaEditor(
                  order.status,
                  `Edit ${order.status} SLA`,
                  `This order is currently in ${order.status}. Update its green, orange, and red dates here.`
                )}

              {notice && <FeedbackMessage variant="success">{notice}</FeedbackMessage>}
              {error && (
                <FeedbackMessage variant="error">
                  <strong>Error:</strong> {error}
                </FeedbackMessage>
              )}

              {order.statusHistory?.length > 0 && (
                <section className="aom-card aom-shell">
                  <div className="aom-card-title">Status history</div>
                  <div className="aom-items">
                    {[...order.statusHistory]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((entry, index) => (
                        <div key={`${entry.status}-${index}`} className="aom-item">
                          <div className="aom-item-main">
                            <strong>{entry.status}</strong>
                            <div className="aom-muted">{formatDateTime(entry.date)}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              )}

              <section className="aom-card aom-shell">
                <div className="aom-card-title">Order items</div>
                <ul className="aom-items">
                  {order.items.map((item, index) => (
                    <li key={`${item.product?._id || item._id}-${index}`} className="aom-item">
                      <div className="aom-item-main">
                        <strong>
                          {item.product?.name} (#{item.product?.productId})
                        </strong>
                        <div className="aom-muted">
                          Supplier: {item.supplier?.name || item.supplier?._id}
                        </div>
                        <div className="aom-muted">Quantity: {item.quantity || 1}</div>
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

              <div className="aom-footer">
                {actions.map((action) => (
                  <button
                    key={action.next}
                    type="button"
                    className="aom-primary"
                    onClick={() => startTransition(action)}
                    disabled={isBusy}
                  >
                    {action.label}
                  </button>
                ))}

                {ORDER_SLA_EDIT_STATUSES.includes(order.status) && (
                  <button
                    type="button"
                    className="aom-btn"
                    onClick={saveCurrentSla}
                    disabled={isBusy || !currentStatusValidation.valid}
                  >
                    {savingSla ? "Saving..." : "Save current SLA"}
                  </button>
                )}

                <button
                  type="button"
                  className="aom-btn"
                  onClick={() => {
                    setConfirmDelete((current) => !current);
                    setError("");
                    setNotice("");
                  }}
                  disabled={isBusy}
                >
                  {confirmDelete ? "Keep order" : "Delete"}
                </button>
                <button
                  type="button"
                  className="aom-ghost"
                  onClick={attemptClose}
                  disabled={isBusy}
                >
                  Close
                </button>
              </div>
            </>
          )}

          {confirmDelete && (
            <InlineConfirm
              title="Delete this order?"
              description="This action cannot be undone."
              confirmLabel={deleting ? "Deleting..." : "Confirm delete"}
              onConfirm={deleteOrder}
              onCancel={() => setConfirmDelete(false)}
              confirmDisabled={isBusy}
              cancelDisabled={isBusy}
            />
          )}
        </div>
      </div>

      {selectedItem && (
        <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
};

export default OrderDetailModal;
