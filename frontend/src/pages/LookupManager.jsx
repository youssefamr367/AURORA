import React, { useCallback, useEffect, useState } from "react";
import {
  createLookupItem,
  deleteLookupItem,
  fetchLookupItems,
  LOOKUP_TYPES,
} from "../features/lookups/api.js";
import "../CSS/LookupManager.css";

const LookupManager = () => {
  const [activeType, setActiveType] = useState(LOOKUP_TYPES[0].value);
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const current = LOOKUP_TYPES.find((type) => type.value === activeType);

  const fetchItems = useCallback(async () => {
    setLoading(true);

    try {
      setItems(await fetchLookupItems(current.api));
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        message: `Could not load ${current.label.toLowerCase()}. ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  }, [current]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setNewName("");
    setPendingDeleteId("");
    setFeedback({ type: "", message: "" });
  }, [activeType]);

  const handleAdd = async () => {
    const name = newName.trim();

    if (!name) {
      setFeedback({
        type: "error",
        message: `Please enter a ${current.label
          .slice(0, -1)
          .toLowerCase()} name before adding.`,
      });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      await createLookupItem(current.api, { name });
      setNewName("");
      await fetchItems();
      setFeedback({
        type: "success",
        message: `${current.label.slice(0, -1)} added successfully.`,
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        message: `Could not add ${current.label
          .slice(0, -1)
          .toLowerCase()}. ${err.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (deletingId) return;

    setDeletingId(id);
    setFeedback({ type: "", message: "" });

    try {
      await deleteLookupItem(current.api, id);
      setPendingDeleteId("");
      await fetchItems();
      setFeedback({
        type: "success",
        message: `${current.label.slice(0, -1)} deleted successfully.`,
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        message: `Could not delete ${current.label
          .slice(0, -1)
          .toLowerCase()}. ${err.message}`,
      });
    } finally {
      setDeletingId("");
    }
  };

  const isBusy = loading || submitting || !!deletingId;

  return (
    <div className="LookupManager">
      <h2>Customization Options</h2>

      <div className="tabs">
        {LOOKUP_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            className={type.value === activeType ? "tab active" : "tab"}
            onClick={() => setActiveType(type.value)}
            disabled={isBusy}
          >
            {type.label}
          </button>
        ))}
      </div>

      {feedback.message && (
        <div
          className={`lookup-feedback lookup-feedback--${feedback.type || "info"}`}
          role={feedback.type === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </div>
      )}

      <div className="add-row">
        <input
          type="text"
          placeholder={`New ${current.label.slice(0, -1)}`}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAdd();
            }
          }}
          disabled={isBusy}
        />
        <button type="button" onClick={handleAdd} disabled={isBusy}>
          {submitting ? "Adding..." : "Add"}
        </button>
      </div>

      <ul className="lookup-list">
        {loading && (
          <li className="empty">Loading {current.label.toLowerCase()}...</li>
        )}

        {!loading &&
          items.map((item) => (
            <li key={item._id}>
              <div className="lookup-item-main">
                <span>{item.name}</span>
                {pendingDeleteId === item._id ? (
                  <div className="lookup-confirm">
                    <span>Delete this item?</span>
                    <div className="lookup-confirm-actions">
                      <button
                        type="button"
                        className="lookup-confirm-btn danger"
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                      >
                        {deletingId === item._id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        type="button"
                        className="lookup-confirm-btn"
                        onClick={() => setPendingDeleteId("")}
                        disabled={deletingId === item._id}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="del-btn"
                    onClick={() => {
                      setPendingDeleteId(item._id);
                      setFeedback({ type: "", message: "" });
                    }}
                    disabled={isBusy}
                    aria-label={`Delete ${item.name}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}

        {!loading && items.length === 0 && (
          <li className="empty">No {current.label.toLowerCase()} defined.</li>
        )}
      </ul>
    </div>
  );
};

export default LookupManager;
