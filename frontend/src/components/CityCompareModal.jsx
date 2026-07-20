import { useEffect, useState } from "react";
import { api } from "../api";
import { formatDollars } from "../priceFormat";
import { CITY_PRESETS } from "../cityPresets";

export default function CityCompareModal({ open, onClose, values, currentCity }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setRows(null);
    setError(null);

    Promise.all(
      CITY_PRESETS.map((c) =>
        api
          .predict({ ...values, Latitude: c.lat, Longitude: c.lon })
          .then((res) => ({ city: c.name, price: res.price }))
          .catch(() => null)
      )
    ).then((results) => {
      const ok = results.filter(Boolean).sort((a, b) => b.price - a.price);
      if (!ok.length) setError("Couldn't compare cities right now — try again.");
      setRows(ok);
    });
  }, [open, values]);

  if (!open) return null;

  const maxPrice = rows?.length ? rows[0].price : 1;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏙️ Same home, different city</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="modal-subtitle">
          Here's what this exact property would be worth if it were located in each city instead, keeping every other detail the same.
        </p>

        {error && <div className="price-error">{error}</div>}

        {!rows && !error && <div className="price-placeholder">Comparing cities…</div>}

        {rows && (
          <div className="compare-list">
            {rows.map((r, i) => (
              <div className={`compare-row${r.city === currentCity ? " compare-row-active" : ""}`} key={r.city}>
                <span className="compare-rank">#{i + 1}</span>
                <span className="compare-city">
                  {r.city}
                  {r.city === currentCity && <span className="compare-tag">your pick</span>}
                </span>
                <div className="compare-track">
                  <div className="compare-fill" style={{ width: `${(r.price / maxPrice) * 100}%` }} />
                </div>
                <span className="compare-price">{formatDollars(r.price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
