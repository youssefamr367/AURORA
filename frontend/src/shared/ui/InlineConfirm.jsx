import "./ui.css";

const InlineConfirm = ({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmDisabled = false,
  cancelDisabled = false,
}) => (
  <div className="ui-confirm" role="alert">
    <div className="ui-confirm__copy">
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
    </div>
    <div className="ui-confirm__actions">
      <button
        type="button"
        className="ui-confirm__button ui-confirm__button--danger"
        onClick={onConfirm}
        disabled={confirmDisabled}
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        className="ui-confirm__button"
        onClick={onCancel}
        disabled={cancelDisabled}
      >
        {cancelLabel}
      </button>
    </div>
  </div>
);

export default InlineConfirm;
