export default function Field({ label, value, as = "input", children, ...props }) {
  const filled = value !== undefined && value !== null && String(value).length > 0;
  const Tag = as;
  return (
    <div className={`float-field ${filled ? "filled" : ""}`}>
      <Tag value={value} {...props}>
        {children}
      </Tag>
      <label>{label}</label>
    </div>
  );
}
