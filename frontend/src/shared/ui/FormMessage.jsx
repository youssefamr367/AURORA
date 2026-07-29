import "./ui.css";

const FormMessage = ({ children, variant = "hint", className = "" }) => (
  <div
    className={`ui-form-message${
      variant === "error" ? " ui-form-message--error" : ""
    }${className ? ` ${className}` : ""}`}
  >
    {children}
  </div>
);

export default FormMessage;
