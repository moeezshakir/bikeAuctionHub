export function InfoTile({ label, value }) {
  return (
    <article className="info-tile">
      <span className="info-label">{label}</span>
      <strong className="info-value">{value}</strong>
    </article>
  );
}

export function InfoGrid({ children }) {
  return <div className="info-grid">{children}</div>;
}
