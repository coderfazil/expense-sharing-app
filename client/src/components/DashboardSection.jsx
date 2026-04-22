const DashboardSection = ({ title, emptyMessage, items, renderItem }) => (
  <section className="data-block">
    <h2>{title}</h2>
    {items.length ? (
      <div className="card-list">{items.map(renderItem)}</div>
    ) : (
      <div className="card-list empty-state">{emptyMessage}</div>
    )}
  </section>
);

export default DashboardSection;
