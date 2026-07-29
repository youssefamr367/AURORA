import "./ui.css";

const PageState = ({ title, description, variant = "default", className = "" }) => (
  <div
    className={`ui-page-state${
      variant === "error" ? " ui-page-state--error" : ""
    }${className ? ` ${className}` : ""}`}
    role={variant === "error" ? "alert" : "status"}
  >
    <strong>{title}</strong>
    {description ? <span>{description}</span> : null}
  </div>
);

export default PageState;
