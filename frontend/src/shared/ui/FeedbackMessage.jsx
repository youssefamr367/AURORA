import "./ui.css";

const FeedbackMessage = ({
  children,
  variant = "info",
  className = "",
  role,
}) => {
  const messageRole = role || (variant === "error" ? "alert" : "status");

  return (
    <div
      className={`ui-feedback ui-feedback--${variant}${className ? ` ${className}` : ""}`}
      role={messageRole}
    >
      {children}
    </div>
  );
};

export default FeedbackMessage;
