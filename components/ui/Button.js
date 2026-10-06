export default function Button({ variant = "primary", className = "", type = "button", ...props }) {
  return <button type={type} className={`btn ${variant === "primary" ? "" : variant} ${className}`.trim()} {...props} />;
}
