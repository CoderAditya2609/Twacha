export default function Chip({ on, children, ...props }) {
  return (
    <button type="button" className={`chip ${on ? "on" : ""}`} {...props}>
      {children}
    </button>
  );
}
